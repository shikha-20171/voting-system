const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

if (!code.includes('const [fakeVillageFilter, setFakeVillageFilter]')) {
  code = code.replace(/const \[fakeVoterSearch, setFakeVoterSearch\] = useState\(''\);/,
    `const [fakeVoterSearch, setFakeVoterSearch] = useState('');
  const [fakeVillageFilter, setFakeVillageFilter] = useState('All');
  const [fakeBoothFilter, setFakeBoothFilter] = useState('All');
  const [fakeStatusFilter, setFakeStatusFilter] = useState('All');`);
}

code = code.replace(/\{fakeVotersList\.length > 0 \? \(/,
`
            <div className="flex flex-wrap gap-3 mt-4">
              <select value={fakeVillageFilter} onChange={e => setFakeVillageFilter(e.target.value)} className="p-2 border border-slate-200 rounded text-xs bg-white">
                <option value="All">All Villages</option>
                {uniqueVillages.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={fakeBoothFilter} onChange={e => setFakeBoothFilter(e.target.value)} className="p-2 border border-slate-200 rounded text-xs bg-white">
                <option value="All">All Booths</option>
                {uniqueBooths.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={fakeStatusFilter} onChange={e => setFakeStatusFilter(e.target.value)} className="p-2 border border-slate-200 rounded text-xs bg-white">
                <option value="All">All Statuses</option>
                <option value="Fake">Fake</option>
                <option value="Duplicate">Duplicate</option>
                <option value="Doubtful">Doubtful</option>
              </select>
            </div>
            {fakeVotersList.length > 0 ? (`);

code = code.replace(/fakeVotersList\.map\(\(voter, idx\) => \{/,
`fakeVotersList.filter(v => (fakeVillageFilter === 'All' || v.village === fakeVillageFilter) && (fakeBoothFilter === 'All' || v.boothNumber === fakeBoothFilter) && (fakeStatusFilter === 'All' || v.voterStatus === fakeStatusFilter)).map((voter, idx) => {`);


fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
