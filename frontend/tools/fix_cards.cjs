const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

code = code.replace(/\{\/\* Election Forecast Banner \*\/\}[\s\S]*?id="metric-fake-votes"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
`{/* Top 4 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="mandal-metrics-grid">
              {/* Card 1: Total Voters */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-total-voters">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Voters</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{totalVotersCount}</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Total Villages */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-total-villages">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Villages</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{SINGARAYAKONDA_VILLAGES.length}</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Total Booths */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-total-booths">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total Booths</p>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{uniqueBooths.length}</h3>
                  <p className="text-[9px] text-slate-400 font-bold">Booth Incharges: {uniqueBooths.length}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-500">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Projected Result */}
              <div className="bg-yellow-400 border border-yellow-500 rounded-xl p-5 shadow-sm flex items-center justify-between" id="metric-projected-result">
                <div className="space-y-1.5 text-slate-950">
                  <p className="text-[10px] font-black uppercase tracking-wider">Projected Result</p>
                  <h3 className="text-2xl font-black leading-none uppercase">{forecastData.leadingParty} LEADS</h3>
                  <p className="text-[11px] font-bold">+{forecastData.leadCount} Votes</p>
                </div>
                <div className="p-3 bg-yellow-500 rounded-xl text-yellow-900 shadow-inner">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>`);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
