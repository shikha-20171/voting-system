import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../app.js';
import { prisma } from '../lib/prisma.js';
import { hashOtp } from '../lib/crypto.js';
import { RoleType } from '@prisma/client';

describe('Production Authentication & SMS OTP Suite', () => {
  let app: any;
  let testUser: any;
  let testMobile = '9848012345';
  let testRole = RoleType.CONSTITUENCY_INCHARGE;

  before(async () => {
    app = buildApp();
    await app.ready();

    // Fetch seeded test user
    testUser = await prisma.user.findFirst({
      where: { mobileNumber: testMobile, role: testRole },
      include: {
        organisation: true,
        roleRef: true,
        hierarchyAssignments: true,
      },
    });

    assert.ok(testUser, 'Seeded test user must exist');

    // Clean old OTP verification records for test user
    await prisma.oTPVerification.deleteMany({
      where: { mobileNumber: testMobile },
    });
  });

  it('1. POST /api/auth/request-otp generates hashed OTP and returns requestId & cooldown', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: {
        mobileNumber: testMobile,
        role: testRole,
      },
    });

    assert.equal(res.statusCode, 200, `Expected 200, got ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, true);
    assert.ok(json.data.requestId);
    assert.equal(json.data.cooldownSeconds, 60);
    assert.ok(json.data.devOtp);

    // Verify OTP is hashed in DB and not plain text
    const dbRecord = await prisma.oTPVerification.findUnique({
      where: { id: json.data.requestId },
    });
    assert.ok(dbRecord);
    assert.notEqual(dbRecord.otpCode, json.data.devOtp, 'Stored OTP in DB must be hashed, not plaintext');
    assert.equal(dbRecord.otpCode.length, 64, 'Hash must be 64-character SHA-256 hex');
  });

  it('2. POST /api/auth/request-otp rejects cooldown violation if requested within 60 seconds', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: {
        mobileNumber: testMobile,
        role: testRole,
      },
    });

    assert.equal(res.statusCode, 429, `Expected 429 cooldown error, got ${res.statusCode}`);
    const json = JSON.parse(res.body);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'OTP_COOLDOWN_ACTIVE');
  });

  it('3. POST /api/auth/verify-otp rejects invalid OTP code and increments attempt counter', async () => {
    // Clear cooldown to create a fresh test OTP
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId } = JSON.parse(reqRes.body).data;

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: {
        requestId,
        otpCode: '000000', // incorrect code
      },
    });

    assert.equal(verifyRes.statusCode, 400);
    const json = JSON.parse(verifyRes.body);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'INCORRECT_OTP');
    assert.equal(json.error.details.remainingAttempts, 4);

    const dbRecord = await prisma.oTPVerification.findUnique({ where: { id: requestId } });
    assert.equal(dbRecord?.attempts, 1);
  });

  it('4. POST /api/auth/verify-otp permanently locks session after max attempts exceeded', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId, devOtp } = JSON.parse(reqRes.body).data;

    // Set attempts to 5 in DB
    await prisma.oTPVerification.update({
      where: { id: requestId },
      data: { attempts: 5 },
    });

    // Even with the CORRECT OTP code, it must reject because max attempts are exceeded
    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: {
        requestId,
        otpCode: devOtp || '123456',
      },
    });

    assert.equal(verifyRes.statusCode, 429);
    const json = JSON.parse(verifyRes.body);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'OTP_MAX_ATTEMPTS_EXCEEDED');
  });

  it('5. POST /api/auth/verify-otp rejects expired OTP', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId, devOtp } = JSON.parse(reqRes.body).data;

    // Set expired time in DB
    await prisma.oTPVerification.update({
      where: { id: requestId },
      data: { expiresAt: new Date(Date.now() - 10000) },
    });

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: {
        requestId,
        otpCode: devOtp || '123456',
      },
    });

    assert.equal(verifyRes.statusCode, 400);
    const json = JSON.parse(verifyRes.body);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'OTP_EXPIRED');
  });

  it('6. POST /api/auth/verify-otp succeeds for valid OTP, sets httpOnly cookies, and loads hierarchy', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId, devOtp } = JSON.parse(reqRes.body).data;

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: {
        requestId,
        otpCode: devOtp || '123456',
      },
    });

    assert.equal(verifyRes.statusCode, 200);
    const json = JSON.parse(verifyRes.body);
    assert.equal(json.success, true);
    assert.ok(json.data.token, 'Must return JWT token');
    assert.ok(json.data.refreshToken, 'Must return refresh token');
    assert.equal(json.data.user.mobileNumber, testMobile);
    assert.equal(json.data.user.role, testRole);

    // Verify hierarchy context loaded
    assert.ok(json.data.user.hierarchyAssignment, 'Must load hierarchy assignment');
    assert.equal(json.data.user.hierarchyAssignment.constituency.code, 'KONDAPI-AC');

    // Verify httpOnly cookie set in headers
    const setCookie = verifyRes.headers['set-cookie'];
    assert.ok(setCookie, 'Must set access_token and refresh_token cookies');
  });

  it('7. POST /api/auth/verify-otp rejects OTP reuse (Replay Protection)', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId, devOtp } = JSON.parse(reqRes.body).data;

    // First verification (success)
    await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: { requestId, otpCode: devOtp || '123456' },
    });

    // Replay attempt with same requestId
    const replayRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: { requestId, otpCode: devOtp || '123456' },
    });

    assert.equal(replayRes.statusCode, 400);
    const json = JSON.parse(replayRes.body);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'OTP_ALREADY_USED');
  });

  it('8. POST /api/auth/refresh issues fresh access token', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId, devOtp } = JSON.parse(reqRes.body).data;

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: { requestId, otpCode: devOtp || '123456' },
    });
    const { refreshToken } = JSON.parse(verifyRes.body).data;

    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken },
    });

    assert.equal(refreshRes.statusCode, 200);
    const json = JSON.parse(refreshRes.body);
    assert.equal(json.success, true);
    assert.ok(json.data.token, 'Must return refreshed access token');
  });

  it('9. GET /api/auth/me returns complete authenticated profile with full hierarchy', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId, devOtp } = JSON.parse(reqRes.body).data;

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: { requestId, otpCode: devOtp || '123456' },
    });
    const { token } = JSON.parse(verifyRes.body).data;

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(meRes.statusCode, 200);
    const json = JSON.parse(meRes.body);
    assert.equal(json.success, true);
    assert.equal(json.data.id, testUser.id);
    assert.equal(json.data.userCode, testUser.userCode);
    assert.ok(json.data.organisation);
    assert.ok(json.data.roleDetails);
    assert.ok(json.data.hierarchyAssignment);
    assert.equal(json.data.hierarchyAssignment.constituency.code, 'KONDAPI-AC');
  });

  it('10. POST /api/auth/logout revokes session and clears cookies', async () => {
    await prisma.oTPVerification.deleteMany({ where: { mobileNumber: testMobile } });

    const reqRes = await app.inject({
      method: 'POST',
      url: '/api/auth/request-otp',
      payload: { mobileNumber: testMobile, role: testRole },
    });
    const { requestId, devOtp } = JSON.parse(reqRes.body).data;

    const verifyRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-otp',
      payload: { requestId, otpCode: devOtp || '123456' },
    });
    const { token } = JSON.parse(verifyRes.body).data;

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(logoutRes.statusCode, 200);
    const json = JSON.parse(logoutRes.body);
    assert.equal(json.data.loggedOut, true);
  });

  it('11. Protected API rejects unauthorized requests without token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/voters',
    });

    assert.equal(res.statusCode, 401);
    const json = JSON.parse(res.body);
    assert.equal(json.success, false);
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });
});
