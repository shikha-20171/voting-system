const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/setSelectedRoleForLogin\(null\);/g, '');
code = code.replace(/\{\/\* 1\. Login Authentication Modal \*\/\}[\s\S]*?<\/[Ll]oginModal>[\s\S]*?\)\}/, '');
// wait, the previous code block was:
/*
      {selectedRoleForLogin && (
        <LoginModal 
          role={selectedRoleForLogin}
          onClose={() => setSelectedRoleForLogin(null)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
*/

code = code.replace(/\{\s*\/\*\s*1\.\s*Login Authentication Modal\s*\*\/\s*\}[\s\S]*?selectedRoleForLogin && \([\s\S]*?<LoginModal[\s\S]*?\/>\s*\)\s*\}/, '');

fs.writeFileSync('src/App.tsx', code);
