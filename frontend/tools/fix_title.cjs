const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const titleOrig = `                <div className="space-y-1">
                  <span className="text-[10px] bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                    Kondapi Assembly Constituency
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight" id="mandal-overview-title">
                    Singarayakonda Mandal Dashboard
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Overview of all Villages, Booths and Voters in Singarayakonda Mandal.</p>
                </div>`;
const titleNew = `                <div className="space-y-1">
                  <span className="text-[10px] bg-yellow-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase tracking-widest">
                    Mandal Dashboard
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight" id="mandal-overview-title">
                    Singarayakonda Mandal Dashboard
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Kondapi Assembly Constituency • Singarayakonda Mandal</p>
                </div>`;
code = code.replace(titleOrig, titleNew);
fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
