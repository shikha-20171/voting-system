const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

code = code.replace(/<div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-5">[\s\S]*?<h3 className="font-bold text-base text-slate-900">Voter Sentiment & Ground Report Breakdown<\/h3>[\s\S]*?<p className="text-xs text-slate-400 font-semibold">Dynamic preference distribution of voters across all booths<\/p>/,
`<div className="lg:col-span-2 bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-5">
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 uppercase">MANDAL POLITICAL PREFERENCE BREAKDOWN</h3>
                    <p className="text-xs text-slate-400 font-semibold">Dynamic preference distribution of voters across Singarayakonda Mandal</p>`);

code = code.replace(/<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sentiment-split-section">/,
`<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sentiment-split-section">`); // No change

code = code.replace(/<h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Ground Preference Counts<\/h4>/,
`<h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Mandal Political Preference Counts</h4>`);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
