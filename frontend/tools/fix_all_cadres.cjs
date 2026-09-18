const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const injection = `
  const { villageIncharges, boothIncharges, voter100Incharges } = useMemo(() => getMandalCadreNetwork(), []);
  const ALL_CADRES = useMemo(() => {
    return [
      ...villageIncharges.map((v, i) => ({ id: 'VIL-'+i, name: v.name, group: v.village, role: 'VILLAGE_INCHARGE' })),
      ...boothIncharges.map((b, i) => ({ id: 'BOO-'+i, name: b.name, group: b.booth, role: 'BOOTH_PRESIDENT' })),
      ...voter100Incharges.map((v, i) => ({ id: 'V100-'+i, name: v.name, group: v.booth, role: 'VOTER_100_INCHARGE' }))
    ];
  }, [villageIncharges, boothIncharges, voter100Incharges]);
`;

code = code.replace(/export default function MandalInchargeDashboard\(\{ session, onLogout \}: MandalInchargeDashboardProps\) \{/,
  `export default function MandalInchargeDashboard({ session, onLogout }: MandalInchargeDashboardProps) {\n${injection}`);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
