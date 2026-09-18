const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

if (!code.includes('const uniqueVillages = useMemo')) {
  code = code.replace(/const uniqueBooths = useMemo/,
  `const uniqueVillages = useMemo(() => Array.from(new Set(voters.map(v => v.village))), [voters]);\n  const uniqueBooths = useMemo`);
}

const uiReplace = `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">`;

code = code.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">/, uiReplace);
code = code.replace(/<div className="grid grid-cols-1 sm:grid-cols-4 gap-3">/, uiReplace); // check both possibilities

const filtersHTML = `
                {/* Village selector */}
                <div>
                  <select
                    value={villageFilter}
                    onChange={(e) => { setVillageFilter(e.target.value); setBoothFilter('All'); }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value="All">All Villages</option>
                    {uniqueVillages.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                {/* Booth selector */}`;

code = code.replace(/\{\/\* Booth selector \*\/\}/, filtersHTML);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
