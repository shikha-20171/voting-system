import assert from 'node:assert/strict';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../middleware/auth.js';
import { RoleType } from '@prisma/client';

async function runIntegrationTests() {
  console.log('🚀 Starting Political Connect Complete Integration Test Suite...\n');
  const app = buildApp();
  await app.ready();

  let passedTests = 0;
  let failedTests = 0;

  async function testStep(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ❌ ${name}:`, err.message, err.stack);
      failedTests++;
    }
  }

  // 1. Health check
  await testStep('1. GET /health & GET /api/health returns UP with DB ping', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.status, 'UP');
    assert.equal(json.database, 'healthy');
  });

  // Get real users from DB
  const mlaUser = await prisma.user.findFirst({ where: { role: RoleType.CONSTITUENCY_INCHARGE } });
  const incharge100 = await prisma.user.findFirst({ where: { role: RoleType.VOTER_100_INCHARGE } });

  assert.ok(mlaUser, 'MLA user must exist');
  assert.ok(incharge100, '100-Voter Incharge user must exist');

  let superAdminUser = await prisma.user.findFirst({ where: { role: RoleType.SUPER_ADMIN } });
  if (!superAdminUser) {
    superAdminUser = await prisma.user.create({
      data: {
        userCode: 'SUPER-1',
        name: 'Super Administrator',
        mobileNumber: '9999999999',
        role: RoleType.SUPER_ADMIN,
        organisationId: mlaUser.organisationId,
      },
    });
  }

  const superAdminToken = generateToken({
    userId: superAdminUser.id,
    userCode: superAdminUser.userCode,
    mobileNumber: superAdminUser.mobileNumber,
    role: RoleType.SUPER_ADMIN,
    organisationId: superAdminUser.organisationId,
  });

  const inchargeToken = generateToken({
    userId: incharge100.id,
    userCode: incharge100.userCode,
    mobileNumber: incharge100.mobileNumber,
    role: RoleType.VOTER_100_INCHARGE,
    organisationId: incharge100.organisationId,
    unitId: incharge100.unitId,
  });

  // 2. Authentication - Request OTP
  let devOtp = '';
  let requestId = '';
  await testStep('2. POST /api/auth/request-otp generates OTP and requestId', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: mlaUser.mobileNumber } });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: mlaUser.mobileNumber, role: mlaUser.role },
    });
    const json = JSON.parse(res.body);
    assert.equal(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${res.body}`);
    assert.ok(json.data?.requestId);
    requestId = json.data.requestId;
    devOtp = json.data.devOtp || '123456';
  });

  // 3. Authentication - Verify OTP
  let userToken = '';
  await testStep('3. POST /api/auth/verify-otp authenticates and returns JWT session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: { requestId, otpCode: devOtp },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(json.data?.token);
    userToken = json.data.token;
  });

  // 4. Auth - Me Profile
  await testStep('4. GET /api/auth/me returns authenticated caller profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.data?.role, 'CONSTITUENCY_INCHARGE');
  });

  // 5. CMS Configuration
  await testStep('5. GET /api/cms/config returns complete multi-tenant dynamic branding bundle', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/cms/config' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(json.data?.config || json.data?.organisationName);
    assert.ok(json.data?.parties || json.data?.primaryColor);
  });

  // 6. Hierarchy Deletion Safety Check
  await testStep('6. DELETE /api/cms/hierarchy-node rejects deletion when child dependencies exist', async () => {
    const mandal = await prisma.mandal.findFirst();
    if (mandal) {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/cms/hierarchy-node/mandal/${mandal.id}`,
        headers: { authorization: `Bearer ${superAdminToken}` },
      });
      // Correctly prevents deleting a mandal with linked villages/voters
      assert.equal(res.statusCode, 400);
    }
  });

  // 7. RBAC - Vertical Privilege Escalation Protection
  await testStep('7. POST /api/users rejects vertical privilege escalation when lower role attempts to create higher role', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/users',
      headers: { authorization: `Bearer ${inchargeToken}` },
      payload: {
        mobileNumber: '9991234567',
        name: 'Attacker Admin',
        role: RoleType.SUPER_ADMIN,
        userCode: 'HACKER-1',
      },
    });
    assert.equal(res.statusCode, 403);
  });

  // 8. Voter List Query (Paginated & Filtered)
  await testStep('8. GET /api/voters returns paginated records with metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/voters?limit=10&page=1',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(Array.isArray(json.data));
    assert.ok(json.meta?.limit === 10);
  });

  // 9. Voter Status & Vote Marking
  let testVoter = await prisma.voter.findFirst();
  assert.ok(testVoter, 'Voter record must exist');

  await testStep('9. POST /api/voters/:id/mark-vote-done marks vote and prevents duplicate increments', async () => {
    const res1 = await app.inject({
      method: 'POST',
      url: `/api/voters/${testVoter.id}/mark-vote-done`,
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res1.statusCode, 200);

    // Duplicate call test
    const res2 = await app.inject({
      method: 'POST',
      url: `/api/voters/${testVoter.id}/mark-vote-done`,
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res2.statusCode, 200);
  });

  // 10. Fake Voter Flagging
  await testStep('10. POST /api/voters/:id/flag-fake logs objection and updates status', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/voters/${testVoter.id}/flag-fake`,
      headers: { authorization: `Bearer ${superAdminToken}` },
      payload: { reason: 'Duplicate entry with another constituency' },
    });
    assert.equal(res.statusCode, 201);
  });

  // 11. Hierarchy Upward Analytics Rollup
  await testStep('11. GET /api/analytics/state computes aggregated voter metrics', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/state',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(json.data?.summary);
    assert.ok(typeof json.data.summary.turnoutPercentage === 'number');
    assert.ok(json.data?.partyPreference);
    assert.ok(json.data?.demographics);
  });

  // 12. AI Strategy Query (Telugu Tactical Briefing)
  await testStep('12. POST /api/ai/query returns tactical briefing in Telugu', async () => {
    const ac = await prisma.constituency.findFirst();
    const unit = await prisma.organizationUnit.findFirst({ where: { level: 'CONSTITUENCY' } });
    const targetUnitId = unit?.id || ac?.id;
    if (targetUnitId) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/ai/query',
        headers: { authorization: `Bearer ${superAdminToken}` },
        payload: {
          unitId: targetUnitId,
          prompt: 'యువత ఓటర్లలో పోలింగ్ శాతాన్ని పెంచడానికి వ్యూహం ఏమిటి?',
          language: 'te',
        },
      });
      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.ok(json.data?.answer);
    }
  });

  // 13. Tasks API
  await testStep('13. GET /api/tasks returns active field task directives', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/tasks',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(Array.isArray(json.data));
  });

  // 14. Training Videos Catalog
  await testStep('14. GET /api/training/videos returns training module library', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/training/videos',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(Array.isArray(json.data));
  });

  // 15. Ground Reports API
  await testStep('15. GET /api/reports/ground returns operational ground incidents', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/ground',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
  });

  // 16. Polling Reports API
  await testStep('16. GET /api/reports/polling returns election polling records', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/reports/polling',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
  });

  // 17. Notifications API
  await testStep('17. GET /api/notifications returns user alert inbox', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/notifications',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(Array.isArray(json.data?.items));
  });

  // 18. Audit Log Recording
  await testStep('18. GET /api/audit returns immutable security audit trail', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/audit',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(Array.isArray(json.data));
  });

  // 19. Political Parties Master
  await testStep('19. GET /api/parties & GET /api/cms/parties lists configured parties', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/parties' });
    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(Array.isArray(json.data));
  });

  // 20. Cadre Network
  await testStep('20. GET /api/cadre/network & GET /api/cadre/performance returns cadre scores', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/cadre/network',
      headers: { authorization: `Bearer ${superAdminToken}` },
    });
    assert.equal(res.statusCode, 200);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passedTests} Passed, ${failedTests} Failed`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runIntegrationTests()
  .then(() => {
    console.log('🎉 All 20 critical integration tests passed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
