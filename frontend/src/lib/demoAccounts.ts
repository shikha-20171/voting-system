export interface DemoAccount {
  id: string;
  name: string;
  mobile: string;
  roleId: string;
  roleName: string;
  badge: string;
  jurisdiction: string;
  avatarColor: string;
  isRecommended?: boolean;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  // Super Admin
  {
    id: 'super-admin-shikha',
    roleId: 'SUPER_ADMIN',
    roleName: 'Super Admin',
    name: 'Shikha Gour',
    mobile: '7067680063',
    badge: 'Apex Admin',
    jurisdiction: 'Entire State & Central IT Ops',
    avatarColor: 'bg-amber-500 text-white',
    isRecommended: true,
  },
  {
    id: 'super-admin-it',
    roleId: 'SUPER_ADMIN',
    roleName: 'Super Admin',
    name: 'IT Wing Apex Command',
    mobile: '9848099999',
    badge: 'War Room IT',
    jurisdiction: 'Statewide Analytics & Infrastructure',
    avatarColor: 'bg-yellow-500 text-slate-950',
  },

  // State Incharge
  {
    id: 'state-incharge-tg',
    roleId: 'STATE_ADMIN',
    roleName: 'State Incharge',
    name: 'Telangana State Incharge',
    mobile: '9000012346',
    badge: 'State Command',
    jurisdiction: 'State HQ & Majority Telemetry',
    avatarColor: 'bg-indigo-600 text-white',
    isRecommended: true,
  },
  {
    id: 'state-incharge-shikha',
    roleId: 'STATE_ADMIN',
    roleName: 'State Incharge',
    name: 'Shikha Gour (State)',
    mobile: '7067680063',
    badge: 'Apex Command',
    jurisdiction: 'State Apex War Room',
    avatarColor: 'bg-indigo-500 text-white',
  },

  // Zone Coordinator
  {
    id: 'zone-karimnagar',
    roleId: 'ZONE_INCHARGE',
    roleName: 'Zone Coordinator',
    name: 'Karimnagar Zone Coordinator',
    mobile: '9000012352',
    badge: 'Zone Command',
    jurisdiction: 'Multi-Parliament Zone Cluster',
    avatarColor: 'bg-teal-600 text-white',
    isRecommended: true,
  },
  {
    id: 'zone-karnataka',
    roleId: 'ZONE_INCHARGE',
    roleName: 'Zone Coordinator',
    name: 'Karnataka Central Zone',
    mobile: '9848099998',
    badge: 'Zone Command',
    jurisdiction: 'Central Zone Cluster',
    avatarColor: 'bg-teal-500 text-white',
  },

  // Parliament Incharge
  {
    id: 'parliament-ap',
    roleId: 'PARLIAMENT_INCHARGE',
    roleName: 'Parliament Incharge',
    name: 'AP State War Room Officer',
    mobile: '9848088888',
    badge: 'Lok Sabha Seat',
    jurisdiction: 'Ongole Parliament (7 Assembly Seats)',
    avatarColor: 'bg-fuchsia-600 text-white',
    isRecommended: true,
  },
  {
    id: 'parliament-warangal',
    roleId: 'PARLIAMENT_INCHARGE',
    roleName: 'Parliament Incharge',
    name: 'Warangal Parliament Incharge',
    mobile: '9000012353',
    badge: 'Lok Sabha Seat',
    jurisdiction: 'Warangal Parliament Constituency',
    avatarColor: 'bg-fuchsia-500 text-white',
  },

  // Constituency Incharge
  {
    id: 'constituency-shikha',
    roleId: 'CONSTITUENCY_INCHARGE',
    roleName: 'Constituency Incharge',
    name: 'Shikha Gour',
    mobile: '9848012345',
    badge: 'MLA Candidate',
    jurisdiction: 'Kondapi Assembly Constituency (107)',
    avatarColor: 'bg-amber-500 text-white',
    isRecommended: true,
  },
  {
    id: 'constituency-apex',
    roleId: 'CONSTITUENCY_INCHARGE',
    roleName: 'Constituency Incharge',
    name: 'Shikha Gour (Apex User)',
    mobile: '7067680063',
    badge: 'Super Admin',
    jurisdiction: 'Kondapi AC (All Access)',
    avatarColor: 'bg-emerald-600 text-white',
  },
  {
    id: 'constituency-kondapi',
    roleId: 'CONSTITUENCY_INCHARGE',
    roleName: 'Constituency Incharge',
    name: 'Kondapi MLA Incharge',
    mobile: '9848012347',
    badge: 'MLA Candidate',
    jurisdiction: 'Kondapi Assembly Operations',
    avatarColor: 'bg-amber-600 text-white',
  },

  // Mandal President
  {
    id: 'mandal-kondapi',
    roleId: 'MANDAL_INCHARGE',
    roleName: 'Mandal President',
    name: 'Kondapi Mandal Chief Incharge',
    mobile: '9848077777',
    badge: 'Mandal Block',
    jurisdiction: 'Kondapi Mandal & Division Booths',
    avatarColor: 'bg-emerald-600 text-white',
    isRecommended: true,
  },
  {
    id: 'mandal-nakrekal',
    roleId: 'MANDAL_INCHARGE',
    roleName: 'Mandal President',
    name: 'Nakrekal Mandal President',
    mobile: '9000012349',
    badge: 'Mandal Block',
    jurisdiction: 'Nakrekal Mandal Division',
    avatarColor: 'bg-emerald-500 text-white',
  },

  // Village Incharge
  {
    id: 'village-kondapi',
    roleId: 'VILLAGE_INCHARGE',
    roleName: 'Village Incharge',
    name: 'Village President (Kondapi Town)',
    mobile: '9848010001',
    badge: 'Gram Panchayat',
    jurisdiction: 'Kondapi Town Ward & Local GP',
    avatarColor: 'bg-blue-600 text-white',
    isRecommended: true,
  },
  {
    id: 'village-nalgonda',
    roleId: 'VILLAGE_INCHARGE',
    roleName: 'Village Incharge',
    name: 'Nalgonda Village Incharge',
    mobile: '9000012354',
    badge: 'Gram Panchayat',
    jurisdiction: 'Nalgonda Village Ward',
    avatarColor: 'bg-blue-500 text-white',
  },

  // Booth President
  {
    id: 'booth-ramu',
    roleId: 'BOOTH_PRESIDENT',
    roleName: 'Booth President',
    name: 'Ramu Polling President',
    mobile: '9988776655',
    badge: 'Booth #101',
    jurisdiction: 'Polling Booth 101 (ZP High School)',
    avatarColor: 'bg-purple-600 text-white',
    isRecommended: true,
  },
  {
    id: 'booth-102',
    roleId: 'BOOTH_PRESIDENT',
    roleName: 'Booth President',
    name: 'Booth 102 President',
    mobile: '9848010002',
    badge: 'Booth #102',
    jurisdiction: 'Polling Booth 102 (Primary School)',
    avatarColor: 'bg-purple-500 text-white',
  },

  // 100 Voters Incharge
  {
    id: 'voter100-marella',
    roleId: 'VOTER_100_INCHARGE',
    roleName: '100 Voters Incharge',
    name: 'Marella Venkateswarlu',
    mobile: '9848010003',
    badge: 'Cluster 1',
    jurisdiction: '100-Voter Family Cluster Committee',
    avatarColor: 'bg-orange-600 text-white',
    isRecommended: true,
  },
  {
    id: 'voter100-team1',
    roleId: 'VOTER_100_INCHARGE',
    roleName: '100 Voters Incharge',
    name: 'Voter 100 Incharge - Team 1',
    mobile: '9848012351',
    badge: 'Cluster 2',
    jurisdiction: 'Indiramma Ward Family Cluster',
    avatarColor: 'bg-orange-500 text-white',
  },
];

export function getDemoAccountsForRole(roleId: string): DemoAccount[] {
  const filtered = DEMO_ACCOUNTS.filter((acc) => acc.roleId === roleId);
  if (filtered.length > 0) return filtered;
  // If no direct role match, return fallback super admin / constituency incharge
  return [
    DEMO_ACCOUNTS.find((a) => a.mobile === '7067680063') || DEMO_ACCOUNTS[0],
    DEMO_ACCOUNTS.find((a) => a.mobile === '9848012345') || DEMO_ACCOUNTS[1],
  ];
}
