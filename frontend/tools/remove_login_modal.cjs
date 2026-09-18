const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove import
code = code.replace(/import LoginModal from '\.\/components\/LoginModal';\n/, '');

// Remove selectedRoleForLogin state
code = code.replace(/const \[selectedRoleForLogin, setSelectedRoleForLogin\] = useState<CommandRole \| null>\(null\);\n/, '');

// Remove from handleRoleSelect
code = code.replace(/if \(role\.id === 'MANDAL_INCHARGE' \|\| \(activeSession && activeSession\.role === role\.id\)\) \{[\s\S]*?\} else \{[\s\S]*?setSelectedRoleForLogin\(role\);[\s\S]*?\}/, 
`if (role.id === 'MANDAL_INCHARGE' || role.id === 'CONSTITUENCY_INCHARGE' || (activeSession && activeSession.role === role.id)) {
      window.location.hash = role.path;
    } else {
      window.location.hash = role.path;
    }`);

// Remove modal rendering
code = code.replace(/\{\/\* 1\. Login Authentication Modal \*\/\}\s*\{selectedRoleForLogin && \([\s\S]*?\}\)/, '');

fs.writeFileSync('src/App.tsx', code);
