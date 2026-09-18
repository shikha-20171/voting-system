const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/if \(activeSession && activeSession\.role === role\.id\) {/,
`if (role.id === 'MANDAL_INCHARGE' || (activeSession && activeSession.role === role.id)) {`);

fs.writeFileSync('src/App.tsx', code);
