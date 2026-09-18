const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

code = code.replace(/const updated = loadAllVillageVoters\(\);/,
`let updated: Voter[] = [];
    SINGARAYAKONDA_VILLAGES.forEach(v => {
      updated = [...updated, ...generateVotersForMandalVillage(v.name)];
    });`);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
