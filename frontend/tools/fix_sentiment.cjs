const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

code = code.replace(
  /\{Math\.round\(\(partyStats\[hoveredSlice as VoterPreference\] \/ activeVoters\.length\) \* 100\)\}%\s*Share/,
  '{surveyedVotersCount > 0 ? Math.round((partyStats[hoveredSlice as VoterPreference] / surveyedVotersCount) * 100) : 0}% Share'
);
code = code.replace(
  /<span className="text-\[9px\] font-bold uppercase text-slate-400">Total Active<\/span>\s*<span className="text-lg font-black text-slate-950">\{activeVoters\.length\}<\/span>/,
  '<span className="text-[9px] font-bold uppercase text-slate-400">Surveyed</span>\n                          <span className="text-lg font-black text-slate-950">{surveyedVotersCount}</span>'
);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
