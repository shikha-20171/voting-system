const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const origForecast = `    const lead = leader.count - runnerUp.count;
    
    return {
      leadingParty: leader.party,
      secondParty: runnerUp.party,
      leadCount: lead,
      leaderCount: leader.count,
      runnerUpParty: runnerUp.party,
      runnerUpCount: runnerUp.count
    };
  }, [partyStats]);`;

const newForecast = `    const lead = leader.count - runnerUp.count;
    const leadPercentage = surveyedVotersCount > 0 ? ((lead / surveyedVotersCount) * 100).toFixed(1) : '0.0';
    
    return {
      leadingParty: leader.party,
      secondParty: runnerUp.party,
      leadCount: lead,
      leadPercentage,
      leaderCount: leader.count,
      runnerUpParty: runnerUp.party,
      runnerUpCount: runnerUp.count
    };
  }, [partyStats, surveyedVotersCount]);`;

code = code.replace(origForecast, newForecast);

// Now update Card 4 to include the percentage
const origCard4 = `                  <h3 className="text-2xl font-black leading-none uppercase">{forecastData.leadingParty} LEADS</h3>
                  <p className="text-[11px] font-bold">+{forecastData.leadCount} Votes</p>
                </div>`;
const newCard4 = `                  <h3 className="text-2xl font-black leading-none uppercase">{forecastData.leadingParty} LEADS</h3>
                  <p className="text-[11px] font-bold">+{forecastData.leadCount.toLocaleString()} Votes ({forecastData.leadPercentage}%)</p>
                </div>`;
code = code.replace(origCard4, newCard4);

// And update the large Projected Majority card
const origBigCard = `                    <span className="text-4xl font-black text-slate-900 leading-none tracking-tighter uppercase">{forecastData.leadingParty} +{forecastData.leadCount}</span>
                    <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                      {forecastData.leadingParty} vs {forecastData.secondParty || 'YSRCP'}
                    </span>`;
const newBigCard = `                    <span className="text-4xl font-black text-slate-900 leading-none tracking-tighter uppercase">{forecastData.leadingParty} +{forecastData.leadCount.toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                      {forecastData.leadingParty} vs {forecastData.secondParty || 'YSRCP'} • {forecastData.leadPercentage}% LEAD
                    </span>`;
code = code.replace(origBigCard, newBigCard);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
