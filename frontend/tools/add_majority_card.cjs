const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const additionalLayout = `
            {/* Projected Majority & Breakdown Cards */}
            <div className="space-y-6">
              
              {/* Projected Majority Card (Larger) */}
              <div className="bg-white border-2 border-yellow-400 rounded-xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6" id="mandal-projected-majority">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-yellow-600">Projected Majority</h3>
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-slate-900 leading-none tracking-tighter uppercase">{forecastData.leadingParty} +{forecastData.leadCount}</span>
                    <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                      {forecastData.leadingParty} vs {forecastData.secondParty || 'YSRCP'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-[90px]">
                    <span className="block text-[10px] font-black uppercase text-slate-400">Total Voters</span>
                    <span className="block text-xl font-black text-slate-800">{totalVotersCount}</span>
                  </div>
                </div>
              </div>

              {/* Mandal Political Preference Breakdown Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Mandal Political Preference Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {Object.entries(partyStats).map(([party, count]) => {
                    const p = party as VoterPreference;
                    const pct = activeVoters.length > 0 ? ((count / activeVoters.length) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={party} className={"rounded-xl p-4 border " + PARTY_BG_COLORS[p]}>
                        <h4 className="text-xs font-black tracking-wider uppercase mb-1">{PARTY_NAMES[p]}</h4>
                        <div className="flex flex-col">
                          <span className="text-xl font-black leading-none">{count}</span>
                          <span className="text-[10px] font-bold opacity-80 mt-1">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
`;

code = code.replace(/<div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sentiment-split-section">/, additionalLayout + '\n            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sentiment-split-section">');

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
