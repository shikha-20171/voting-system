const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const tabVillageList = `
        {/* --------------------------------------------------------
            TAB: VILLAGE LIST
           -------------------------------------------------------- */}
        {activeTab === 'village_list' && (
          <div className="space-y-6 animate-fade-in" id="village-list-view">
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Village List</h2>
                <p className="text-xs text-slate-500 font-semibold">All villages in Singarayakonda Mandal</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="px-4 py-3">S.No</th>
                      <th className="px-4 py-3">Village Name</th>
                      <th className="px-4 py-3">Total Voters</th>
                      <th className="px-4 py-3">Booths</th>
                      <th className="px-4 py-3">Local</th>
                      <th className="px-4 py-3">Migrated</th>
                      <th className="px-4 py-3 text-yellow-600">TDP</th>
                      <th className="px-4 py-3 text-blue-600">YSRCP</th>
                      <th className="px-4 py-3 text-red-600">JSP</th>
                      <th className="px-4 py-3 text-orange-600">BJP</th>
                      <th className="px-4 py-3 text-sky-500">INC</th>
                      <th className="px-4 py-3">Neutral</th>
                      <th className="px-4 py-3 text-purple-600">OTH</th>
                      <th className="px-4 py-3">Leading</th>
                      <th className="px-4 py-3">Lead</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                    {SINGARAYAKONDA_VILLAGES.map((v, idx) => {
                      const villageVoters = activeVoters.filter(vo => vo.village === v.name);
                      const localCount = villageVoters.filter(vo => vo.voterLocationStatus !== 'Migrated').length;
                      const migratedCount = villageVoters.length - localCount;
                      
                      const tdp = villageVoters.filter(vo => vo.politicalPreference === 'TDP').length;
                      const ysrcp = villageVoters.filter(vo => vo.politicalPreference === 'YSRCP').length;
                      const jsp = villageVoters.filter(vo => vo.politicalPreference === 'JSP').length;
                      const bjp = villageVoters.filter(vo => vo.politicalPreference === 'BJP').length;
                      const inc = villageVoters.filter(vo => vo.politicalPreference === 'INC').length;
                      const neutral = villageVoters.filter(vo => vo.politicalPreference === 'Neutral').length;
                      const oth = villageVoters.filter(vo => vo.politicalPreference === 'OTH').length;

                      const parties = [
                        { p: 'TDP', c: tdp },
                        { p: 'YSRCP', c: ysrcp },
                        { p: 'JSP', c: jsp },
                        { p: 'BJP', c: bjp },
                        { p: 'INC', c: inc }
                      ].sort((a,b) => b.c - a.c);

                      const leader = parties[0].c > 0 ? parties[0].p : '-';
                      const lead = parties[0].c - parties[1].c;

                      return (
                        <tr key={v.name} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">#{String(idx + 1).padStart(2, '0')}</td>
                          <td className="px-4 py-3 font-black text-slate-900">{v.name}</td>
                          <td className="px-4 py-3">{villageVoters.length}</td>
                          <td className="px-4 py-3">{v.booths.length}</td>
                          <td className="px-4 py-3 text-emerald-600">{localCount}</td>
                          <td className="px-4 py-3 text-orange-600">{migratedCount}</td>
                          <td className="px-4 py-3 font-black text-yellow-600">{tdp}</td>
                          <td className="px-4 py-3 font-black text-blue-600">{ysrcp}</td>
                          <td className="px-4 py-3 font-black text-red-600">{jsp}</td>
                          <td className="px-4 py-3 font-black text-orange-600">{bjp}</td>
                          <td className="px-4 py-3 font-black text-sky-500">{inc}</td>
                          <td className="px-4 py-3 font-black text-slate-500">{neutral}</td>
                          <td className="px-4 py-3 font-black text-purple-600">{oth}</td>
                          <td className="px-4 py-3 font-black">
                            {leader !== '-' && <span className={PARTY_TEXT_COLORS[leader as VoterPreference]}>{leader}</span>}
                          </td>
                          <td className="px-4 py-3 font-black">{lead > 0 ? \`+\${lead}\` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------
            TAB: BOOTH INCHARGE LIST
           -------------------------------------------------------- */}
        {activeTab === 'booth_incharge_list' && (
          <div className="space-y-6 animate-fade-in" id="booth-incharge-list-view">
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booth Incharge List</h2>
                <p className="text-xs text-slate-500 font-semibold">All Booth Incharges in Singarayakonda Mandal</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <th className="px-4 py-3">S.No</th>
                      <th className="px-4 py-3">Booth Incharge Name</th>
                      <th className="px-4 py-3">Mobile Number</th>
                      <th className="px-4 py-3">Village</th>
                      <th className="px-4 py-3">Booth Number</th>
                      <th className="px-4 py-3">Assigned Voters</th>
                      <th className="px-4 py-3 text-yellow-600">TDP</th>
                      <th className="px-4 py-3 text-blue-600">YSRCP</th>
                      <th className="px-4 py-3 text-slate-400">Neutral</th>
                      <th className="px-4 py-3">Leading Party / Lead</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                    {(() => {
                      const { boothIncharges } = getMandalCadreNetwork();
                      return boothIncharges.map((incharge, idx) => {
                        const boothVoters = activeVoters.filter(vo => vo.assignedInchargeId === incharge.id);
                        const tdp = boothVoters.filter(vo => vo.politicalPreference === 'TDP').length;
                        const ysrcp = boothVoters.filter(vo => vo.politicalPreference === 'YSRCP').length;
                        const neutral = boothVoters.filter(vo => vo.politicalPreference === 'Neutral').length;

                        const parties = [
                          { p: 'TDP', c: tdp },
                          { p: 'YSRCP', c: ysrcp },
                        ].sort((a,b) => b.c - a.c);
                        const leader = parties[0].c > 0 ? parties[0].p : '-';
                        const lead = parties[0].c - parties[1].c;

                        return (
                          <tr key={incharge.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">#{String(idx + 1).padStart(3, '0')}</td>
                            <td className="px-4 py-3 font-black text-slate-900">{incharge.name}</td>
                            <td className="px-4 py-3">{incharge.mobile}</td>
                            <td className="px-4 py-3">{incharge.village}</td>
                            <td className="px-4 py-3">{incharge.booth}</td>
                            <td className="px-4 py-3 font-black">{boothVoters.length}</td>
                            <td className="px-4 py-3 font-black text-yellow-600">{tdp}</td>
                            <td className="px-4 py-3 font-black text-blue-600">{ysrcp}</td>
                            <td className="px-4 py-3 font-black text-slate-500">{neutral}</td>
                            <td className="px-4 py-3 font-black">
                              {leader !== '-' && (
                                <div className="flex items-center gap-1">
                                  <span className={PARTY_TEXT_COLORS[leader as VoterPreference]}>{leader}</span>
                                  <span className="text-slate-400">({lead > 0 ? '+' + lead : '-'})</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
`;

code = code.replace(/\{\/\* --------------------------------------------------------\s*TAB 2: VOTER LIST\s*-------------------------------------------------------- \*\/\}/, tabVillageList + '\n\n        {/* --------------------------------------------------------\n            TAB 2: VOTER LIST\n           -------------------------------------------------------- */}');

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
