const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

if(!code.includes('const [villageFilter, setVillageFilter] = useState')) {
  code = code.replace(/const \[boothFilter, setBoothFilter\] = useState\('All'\);/,
  `const [villageFilter, setVillageFilter] = useState('All');\n  const [boothFilter, setBoothFilter] = useState('All');`);
}

code = code.replace(/const matchesBooth = boothFilter === 'All' \|\| v.boothNumber === boothFilter;/,
`const matchesVillage = villageFilter === 'All' || v.village === villageFilter;\n      const matchesBooth = boothFilter === 'All' || v.boothNumber === boothFilter;`);

code = code.replace(/return matchesSearch && matchesBooth && matchesPref && matchesStatus && matchesLocation;/,
`return matchesSearch && matchesVillage && matchesBooth && matchesPref && matchesStatus && matchesLocation;`);

code = code.replace(/\[voters, searchQuery, boothFilter, preferenceFilter, statusFilter, locationFilter\]\);/,
`[voters, searchQuery, villageFilter, boothFilter, preferenceFilter, statusFilter, locationFilter]);`);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
