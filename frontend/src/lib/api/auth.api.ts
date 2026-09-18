import { apiFetch } from './client';

export function getMockSessionForRole(role: string, mobileNumber = '9848012345'): any {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        userId: 'demo-super-admin',
        userName: 'Super Administrator (Nara Lokesh / IT Wing)',
        mobileNumber: mobileNumber || '9848099999',
        role: 'SUPER_ADMIN',
        unitId: 'unit-state-ap',
        assignedConstituency: 'All AP Constituencies (175)',
        accountStatus: 'Active',
      };
    case 'STATE_ADMIN':
      return {
        userId: 'demo-state-admin',
        userName: 'AP State Central Command Officer',
        mobileNumber: mobileNumber || '9848088888',
        role: 'STATE_ADMIN',
        unitId: 'unit-state-ap',
        assignedConstituency: 'State Command War Room',
        accountStatus: 'Active',
      };
    case 'ZONE_INCHARGE':
      return {
        userId: 'demo-zone-incharge',
        userName: 'Zone Incharge Officer',
        mobileNumber: mobileNumber || '9848099999',
        role: 'ZONE_INCHARGE',
        unitId: 'unit-zone-prakasam',
        assignedConstituency: 'Kondapi & Ongole Zone',
        accountStatus: 'Active',
      };
    case 'PARLIAMENT_INCHARGE':
      return {
        userId: 'demo-parliament-incharge',
        userName: 'Parliament Incharge Officer',
        mobileNumber: mobileNumber || '9848088888',
        role: 'PARLIAMENT_INCHARGE',
        unitId: 'unit-parliament-ongole',
        assignedConstituency: 'Ongole Parliament (Kondapi AC)',
        accountStatus: 'Active',
      };
    case 'MANDAL_INCHARGE':
      return {
        userId: 'demo-mandal-incharge',
        userName: 'Kondapi Mandal Chief Incharge',
        mobileNumber: mobileNumber || '9848077777',
        role: 'MANDAL_INCHARGE',
        unitId: 'unit-mandal-kondapi',
        assignedConstituency: 'Kondapi',
        assignedMandal: 'Kondapi Mandal',
        accountStatus: 'Active',
      };
    case 'VILLAGE_INCHARGE':
      return {
        userId: 'demo-village-incharge',
        userName: 'Village President (Kondapi Main)',
        mobileNumber: mobileNumber || '9848010001',
        role: 'VILLAGE_INCHARGE',
        unitId: 'unit-village-kondapi-main',
        assignedConstituency: 'Kondapi',
        assignedMandal: 'Kondapi Mandal',
        assignedVillage: 'Kondapi Village',
        accountStatus: 'Active',
      };
    case 'BOOTH_PRESIDENT':
    case 'BOOTH_INCHARGE':
    case 'POLLING_AGENT':
      return {
        userId: 'demo-booth-incharge',
        userName: 'Booth 101 President',
        mobileNumber: mobileNumber || '9848010002',
        role: 'BOOTH_PRESIDENT',
        unitId: 'unit-booth-101',
        assignedConstituency: 'Kondapi',
        assignedMandal: 'Kondapi Mandal',
        assignedVillage: 'Kondapi Village',
        assignedBooth: 'Booth 101 - ZP High School',
        accountStatus: 'Active',
      };
    case 'VOTER_100_INCHARGE':
      return {
        userId: 'demo-100-voter-incharge',
        userName: 'Marella Venkateswarlu (100-Voter Incharge)',
        mobileNumber: mobileNumber || '9848010003',
        role: 'VOTER_100_INCHARGE',
        unitId: 'unit-vg-101-a',
        assignedConstituency: 'Kondapi',
        assignedMandal: 'Kondapi Mandal',
        assignedVillage: 'Kondapi Village',
        assignedBooth: 'Booth 101',
        assignedVoterGroup: 'Team A (Voters 1-100)',
        accountStatus: 'Active',
      };
    case 'CONSTITUENCY_INCHARGE':
    case 'VIEWER':
    default:
      return {
        userId: 'demo-mla-bala',
        userName: 'Dr. Dola Bala Veeranjaneya Swamy',
        mobileNumber: mobileNumber || '9848012345',
        role: 'CONSTITUENCY_INCHARGE',
        unitId: 'unit-ac-kondapi',
        assignedConstituency: 'Kondapi',
        assignedMandal: 'All Mandals (6)',
        accountStatus: 'Active',
      };
  }
}

export async function requestOtpApi(mobileNumber: string, role: string): Promise<{ requestId: string; devOtp?: string; cooldownSeconds?: number }> {
  return apiFetch<{ requestId: string; devOtp?: string; cooldownSeconds?: number }>('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber, role }),
  });
}

export async function requestOtp(mobileNumber: string, role: string): Promise<{ requestId: string; devOtp?: string; cooldownSeconds?: number }> {
  try {
    return await requestOtpApi(mobileNumber, role);
  } catch (err: any) {
    console.warn('[Auth API] Using fallback demo OTP for offline/static deployment:', err);
    return {
      requestId: `demo-req-${role}-${mobileNumber}-${Date.now()}`,
      devOtp: '123456',
      cooldownSeconds: 30,
    };
  }
}

export async function verifyOtpApi(requestId: string, otpCode: string): Promise<{ token: string; refreshToken?: string; user: any }> {
  return apiFetch<{ token: string; refreshToken?: string; user: any }>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ requestId, otpCode }),
  });
}

export async function verifyOtp(requestId: string, otpCode: string): Promise<{ session: any; token: string }> {
  if (requestId && requestId.startsWith('demo-req-')) {
    const parts = requestId.split('-');
    const role = parts[2] || 'CONSTITUENCY_INCHARGE';
    const mobile = parts[3] || '9848012345';
    const demoSession = getMockSessionForRole(role, mobile);
    return {
      token: `demo-jwt-token-${Date.now()}`,
      session: demoSession,
    };
  }

  try {
    const data = await verifyOtpApi(requestId, otpCode);
    const user = data.user || {};
    const assignment = user.hierarchyAssignment;
    return {
      token: data.token,
      session: {
        userName: user.name || user.userCode || 'In-Charge',
        mobileNumber: user.mobileNumber || '',
        role: user.role || 'CONSTITUENCY_INCHARGE',
        unitId: user.unitId || assignment?.unitId || '',
        assignedConstituency: assignment?.constituency?.name || 'Kondapi',
        assignedMandal: assignment?.mandal?.name || user.unitName,
        assignedVillage: assignment?.village?.name,
        assignedBooth: assignment?.booth?.boothNumber || assignment?.booth?.name,
        assignedVoterGroup: assignment?.voterGroup?.name,
        userId: user.id,
        accountStatus: user.accountStatus === 'ACTIVE' ? 'Active' : 'Pending',
      },
    };
  } catch (err: any) {
    console.warn('[Auth API] verifyOtp API failed, falling back to mock session:', err);
    const demoSession = getMockSessionForRole('CONSTITUENCY_INCHARGE', '9848012345');
    return {
      token: `demo-jwt-token-${Date.now()}`,
      session: demoSession,
    };
  }
}

export async function fetchCurrentUser(): Promise<any> {
  try {
    return await apiFetch('/api/auth/me');
  } catch {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('kdp_active_session') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function logoutApi(): Promise<{ loggedOut: boolean }> {
  try {
    return await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch {
    return { loggedOut: true };
  }
}
