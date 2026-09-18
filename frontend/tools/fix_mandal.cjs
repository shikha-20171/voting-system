const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

// PARTY_NAMES update
code = code.replace(/INC: 'INC',/g, "INC: 'Congress',");
code = code.replace(/OTH: 'OTH'/g, "OTH: 'Undecided'");

// 1. Calculations block
const calcReplacement = `
  const TOTAL_MANDAL_REGISTERED_VOTERS = 53186;
  const surveyedVotersCount = voters.length;
  const pendingSurveyCount = Math.max(0, TOTAL_MANDAL_REGISTERED_VOTERS - surveyedVotersCount);
  const surveyCompletionPct = surveyedVotersCount > 0 ? ((surveyedVotersCount / TOTAL_MANDAL_REGISTERED_VOTERS) * 100).toFixed(1) : '0.0';

  const totalVotersCount = TOTAL_MANDAL_REGISTERED_VOTERS;

  // Voters filtered by active (excluding deceased)
  const activeVoters = useMemo(() => voters.filter(v => v.voterStatus !== 'Deceased'), [voters]);
`;
code = code.replace(
  /const totalVotersCount = voters.length;\s*\/\/\s*Voters filtered by active[^\n]*\n\s*const activeVoters = useMemo\(\(\) => voters.filter\(v => v.voterStatus !== 'Deceased'\), \[voters\]\);/g,
  calcReplacement
);

// 2. Card 1 - Total Voters -> Survey Status
const card1Orig = `              {/* Card 1: Total Voters */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-total-voters">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Voters</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{totalVotersCount}</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>`;
const card1New = `              {/* Card 1: Total Voters */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between" id="metric-total-voters">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Voters</p>
                    <h3 className="text-xl font-black text-slate-900 leading-none">{TOTAL_MANDAL_REGISTERED_VOTERS.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
                  <div>
                     <p className="text-[9px] text-slate-400 font-bold uppercase">Surveyed</p>
                     <p className="text-xs font-black text-emerald-600">{surveyedVotersCount.toLocaleString()} ({surveyCompletionPct}%)</p>
                  </div>
                  <div>
                     <p className="text-[9px] text-slate-400 font-bold uppercase">Pending</p>
                     <p className="text-xs font-black text-amber-600">{pendingSurveyCount.toLocaleString()}</p>
                  </div>
                </div>
              </div>`;
code = code.replace(card1Orig, card1New);

// 3. Projected Majority Card update
code = code.replace(
  /<span className="block text-xl font-black text-slate-800">\{totalVotersCount\}<\/span>/g,
  '<span className="block text-xl font-black text-slate-800">{surveyedVotersCount.toLocaleString()}</span>'
);
code = code.replace(
  /<span className="block text-\[10px\] font-black uppercase text-slate-400">Total Voters<\/span>/g,
  '<span className="block text-[10px] font-black uppercase text-slate-400">Surveyed Voters</span>'
);

// 4. Mandal Political Preference Breakdown - add Fake Votes to Grid
const prefBreakdownOrig = `                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {Object.entries(partyStats).map(([party, count]) => {
                    const p = party as VoterPreference;
                    const pct = activeVoters.length > 0 ? (((count as number) / activeVoters.length) * 100).toFixed(1) : '0.0';
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
                </div>`;
const prefBreakdownNew = `                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {Object.entries(partyStats).map(([party, count]) => {
                    const p = party as VoterPreference;
                    const pct = surveyedVotersCount > 0 ? (((count as number) / surveyedVotersCount) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={party} className={"rounded-xl p-3 border " + PARTY_BG_COLORS[p]}>
                        <h4 className="text-[10px] font-black tracking-wider uppercase mb-1">{PARTY_NAMES[p]}</h4>
                        <div className="flex flex-col">
                          <span className="text-lg font-black leading-none">{count}</span>
                          <span className="text-[10px] font-bold opacity-80 mt-1">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Fake Votes Card */}
                  <div className="rounded-xl p-3 border bg-slate-50 border-slate-200 text-slate-600">
                    <h4 className="text-[10px] font-black tracking-wider uppercase mb-1">Fake Votes</h4>
                    <div className="flex flex-col">
                      <span className="text-lg font-black leading-none">{fakeVotesCount}</span>
                      <span className="text-[10px] font-bold opacity-80 mt-1">
                         {surveyedVotersCount > 0 ? ((fakeVotesCount / surveyedVotersCount) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                  </div>
                </div>`;
code = code.replace(prefBreakdownOrig, prefBreakdownNew);

// Write changes
fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
console.log("Replaced successfully!");
