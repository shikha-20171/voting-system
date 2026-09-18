/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import RoleSelection from './components/RoleSelection';
import PasscodeModal from './components/PasscodeModal';
import OtpLoginModal from './components/OtpLoginModal';
import DashboardPlaceholders from './components/DashboardPlaceholders';
import Voter100Dashboard from './components/Voter100Dashboard';
import BoothInchargeDashboard from './components/BoothInchargeDashboard';
import VillageInchargeDashboard from './components/VillageInchargeDashboard';
import MandalInchargeDashboard from './components/MandalInchargeDashboard';
import ConstituencyInchargeDashboard from './components/ConstituencyInchargeDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import StateDashboard from './components/StateDashboard';
import ZoneParliamentDashboard from './components/ZoneParliamentDashboard';
import Footer from './components/Footer';
import HierarchyPulse from './components/HierarchyPulse';
import { CommandRole, RoleType, UserSession } from './types';
import { clearAuthToken, getAuthToken, setAuthToken } from './lib/authStorage';
import { useCms } from './context/CmsContext';
import { Lock, ShieldCheck, Unlock } from 'lucide-react';

const ROUTE_BY_ROLE: Record<RoleType, string> = {
  SUPER_ADMIN: '/super-admin',
  STATE_ADMIN: '/state',
  ZONE_INCHARGE: '/zone',
  PARLIAMENT_INCHARGE: '/parliament',
  CONSTITUENCY_INCHARGE: '/constituency',
  MANDAL_INCHARGE: '/mandal',
  VILLAGE_INCHARGE: '/village',
  BOOTH_PRESIDENT: '/booth',
  VOTER_100_INCHARGE: '/100-voter',
  POLLING_AGENT: '/booth',
  VIEWER: '/constituency',
};

export default function App() {
  const [currentPasscode, setCurrentPasscode] = useState(() => localStorage.getItem('kdp_admin_passcode') || '2026');
  const [isPanelLocked, setIsPanelLocked] = useState(() => localStorage.getItem('kdp_panel_locked') === 'true');
  const [activeSession, setActiveSession] = useState<UserSession | null>(() => {
    const token = getAuthToken();
    const saved = localStorage.getItem('kdp_active_session');
    if (!saved || !token) {
      return null;
    }

    try {
      return JSON.parse(saved) as UserSession;
    } catch {
      return null;
    }
  });
  const [securityModalMode, setSecurityModalMode] = useState<'unlock' | 'change' | null>(null);
  const [selectedRole, setSelectedRole] = useState<CommandRole | null>(null);
  const [currentPath, setCurrentPath] = useState(() => window.location.hash.replace('#', '') || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.replace('#', '') || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('kdp_admin_passcode', currentPasscode);
  }, [currentPasscode]);

  useEffect(() => {
    localStorage.setItem('kdp_panel_locked', isPanelLocked ? 'true' : 'false');
  }, [isPanelLocked]);

  // Validate & re-hydrate user session from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function checkCurrentSession() {
      try {
        const user = await import('./lib/api').then((m) => m.fetchCurrentUser());
        if (isMounted && user) {
          const assignment = user.hierarchyAssignment;
          const restoredSession: UserSession = {
            userName: user.name || user.userCode || 'In-Charge',
            mobileNumber: user.mobileNumber || '',
            role: user.role,
            unitId: user.unitId || assignment?.unitId || '',
            assignedConstituency: assignment?.constituency?.name || 'Kondapi',
            assignedMandal: assignment?.mandal?.name || user.unitName,
            assignedVillage: assignment?.village?.name,
            assignedBooth: assignment?.booth?.boothNumber || assignment?.booth?.name,
            assignedVoterGroup: assignment?.voterGroup?.name,
            userId: user.id,
            accountStatus: user.accountStatus === 'ACTIVE' ? 'Active' : 'Pending',
          };
          setActiveSession(restoredSession);
          localStorage.setItem('kdp_active_session', JSON.stringify(restoredSession));
        }
      } catch {
        // Not logged in or expired session
        if (isMounted && !localStorage.getItem('kdp_active_session')) {
          setActiveSession(null);
        }
      }
    }

    checkCurrentSession();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('kdp_active_session', JSON.stringify(activeSession));
      localStorage.removeItem('kdp_logged_out');
      return;
    }

    localStorage.removeItem('kdp_active_session');
  }, [activeSession]);

  useEffect(() => {
    if (currentPath === '/' && activeSession) {
      window.location.hash = ROUTE_BY_ROLE[activeSession.role];
    }
  }, [activeSession, currentPath]);

  const isDashboardActive = Boolean(activeSession);

  useEffect(() => {
    if (isDashboardActive) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100vh';
    } else {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [isDashboardActive]);

  const currentRouteRole = useMemo<RoleType | null>(() => {
    if (currentPath.startsWith('/constituency')) return 'CONSTITUENCY_INCHARGE';
    if (currentPath.startsWith('/mandal')) return 'MANDAL_INCHARGE';
    if (currentPath.startsWith('/village')) return 'VILLAGE_INCHARGE';
    if (currentPath.startsWith('/booth')) return 'BOOTH_PRESIDENT';
    if (currentPath.startsWith('/100-voter')) return 'VOTER_100_INCHARGE';
    return null;
  }, [currentPath]);

  const isAuthenticatedForCurrentRoute = !currentRouteRole || activeSession?.role === currentRouteRole;

  const handleSelectRole = (role: CommandRole) => {
    setSelectedRole(role);
  };

  const handleLoginSuccess = (session: UserSession, token: string) => {
    setAuthToken(token);
    setActiveSession(session);
    setSelectedRole(null);
    window.location.hash = ROUTE_BY_ROLE[session.role];
  };

  const handleLogout = async () => {
    try {
      const { logoutApi } = await import('./lib/api');
      await logoutApi();
    } catch {
      // ignore network errors on logout
    }
    clearAuthToken();
    localStorage.setItem('kdp_logged_out', 'true');
    localStorage.removeItem('kdp_active_session');
    setActiveSession(null);
    window.location.hash = '/';
  };

  const triggerLock = () => {
    if (isPanelLocked) {
      setSecurityModalMode('unlock');
      return;
    }

    setIsPanelLocked(true);
  };

  const renderLockedWorkspace = () => (
    <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 max-w-md mx-auto space-y-6 select-none animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border-2 border-yellow-400 text-yellow-600 shadow-md">
        <Lock className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Command Workspace Locked</h2>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Access to the Kondapi Constituency Command Center has been locked by the chief operator. Enter the master passcode to unlock.
        </p>
      </div>
      <button
        onClick={() => setSecurityModalMode('unlock')}
        className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-bold rounded-xl shadow-md hover:shadow transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Unlock className="w-4 h-4" />
        Unlock Workspace
      </button>
    </main>
  );

  const renderRoleSelection = () => (
    <RoleSelection
      onSelectRole={handleSelectRole}
      onLock={triggerLock}
      onChangePasscode={() => setSecurityModalMode('change')}
      isPanelLocked={isPanelLocked}
    />
  );

  const renderAuthenticatedView = () => {
    if (!activeSession) {
      return renderRoleSelection();
    }

    switch (activeSession.role) {
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard session={activeSession} onLogout={handleLogout} />;
      case 'STATE_ADMIN':
        return <StateDashboard session={activeSession} onLogout={handleLogout} />;
      case 'ZONE_INCHARGE':
      case 'PARLIAMENT_INCHARGE':
        return <ZoneParliamentDashboard session={activeSession} onLogout={handleLogout} />;
      case 'CONSTITUENCY_INCHARGE':
      case 'VIEWER':
        return <ConstituencyInchargeDashboard session={activeSession} onLogout={handleLogout} />;
      case 'MANDAL_INCHARGE':
        return <MandalInchargeDashboard session={activeSession} onLogout={handleLogout} />;
      case 'VILLAGE_INCHARGE':
        return <VillageInchargeDashboard session={activeSession} onLogout={handleLogout} />;
      case 'BOOTH_PRESIDENT':
      case 'POLLING_AGENT':
        return <BoothInchargeDashboard session={activeSession} onLogout={handleLogout} />;
      case 'VOTER_100_INCHARGE':
        return <Voter100Dashboard session={activeSession} onLogout={handleLogout} />;
      default:
        return <DashboardPlaceholders session={activeSession} onLogout={handleLogout} />;
    }
  };

  const renderView = () => {
    if (isPanelLocked) {
      return renderLockedWorkspace();
    }

    if (!activeSession) {
      return renderRoleSelection();
    }

    return renderAuthenticatedView();
  };

  const { config } = useCms();

  return (
    <div className={`${isDashboardActive ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-gray-50 text-gray-900 flex flex-col justify-between selection:bg-yellow-200`}>
      <div className="h-1.5 w-full shrink-0 transition-colors duration-300" style={{ backgroundColor: config.primaryColor || '#eab308' }} />

      <div className={`${isDashboardActive ? 'h-full overflow-hidden' : 'flex-1'} flex flex-col`}>
        {!activeSession && <Header />}

        <div className={`flex-1 ${isDashboardActive ? 'p-0 overflow-hidden' : 'pb-4 md:pb-6'}`}>
          {renderView()}
        </div>
      </div>

      {!isDashboardActive && <Footer />}

      {selectedRole && (
        <OtpLoginModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {securityModalMode && (
        <PasscodeModal
          mode={securityModalMode}
          currentPasscode={currentPasscode}
          onClose={() => setSecurityModalMode(null)}
          onSuccess={(newPasscode) => {
            if (securityModalMode === 'unlock') {
              setIsPanelLocked(false);
            } else if (securityModalMode === 'change' && newPasscode) {
              setCurrentPasscode(newPasscode);
            }
            setSecurityModalMode(null);
          }}
        />
      )}
    </div>
  );
}
