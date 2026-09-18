const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/\/\/ Auto-authenticate for Mandal Incharge route/,
`// Auto-authenticate for Constituency Incharge route
  useEffect(() => {
    if (currentPath.startsWith('/constituency')) {
      if (!activeSession || activeSession.role !== 'CONSTITUENCY_INCHARGE') {
        const defaultSession: UserSession = {
          userName: "Chundi Ramesh Naidu",
          mobileNumber: "9848022334",
          role: "CONSTITUENCY_INCHARGE",
          assignedConstituency: "Kondapi Assembly Constituency",
          userId: "KDP-CON-01",
          accountStatus: "Active"
        };
        setActiveSession(defaultSession);
      }
    }
  }, [currentPath, activeSession]);

  // Auto-authenticate for Mandal Incharge route`);

fs.writeFileSync('src/App.tsx', code);
