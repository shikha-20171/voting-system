const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const cadreDef = `
  const { villageIncharges, boothIncharges, voter100Incharges } = useMemo(() => getMandalCadreNetwork(), []);
  
  const ALL_CADRES = useMemo(() => {
    return [
      ...villageIncharges.map((v, i) => ({ id: 'VIL-'+i, name: v.name, group: v.village, role: 'VILLAGE_INCHARGE' })),
      ...boothIncharges.map((b, i) => ({ id: 'BOO-'+i, name: b.name, group: b.booth, role: 'BOOTH_PRESIDENT' })),
      ...voter100Incharges.map((v, i) => ({ id: 'V100-'+i, name: v.name, group: v.booth, role: 'VOTER_100_INCHARGE' }))
    ];
  }, [villageIncharges, boothIncharges, voter100Incharges]);
`;

code = code.replace(/const \{ villageIncharges, boothIncharges, voter100Incharges \} = useMemo\(\(\) => getMandalCadreNetwork\(\), \[\]\);/, cadreDef);

// Replace usages of INCHARGES
code = code.replace(/INCHARGES/g, 'ALL_CADRES');
code = code.replace(/getBoothForIncharge\(inc\.id\)/g, "inc.group");
code = code.replace(/\(\(count \/ activeVoters\.length\)/g, "(((count as number) / activeVoters.length)");

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
