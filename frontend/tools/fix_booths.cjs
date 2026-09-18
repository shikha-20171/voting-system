const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const origBooths = `  // Booth Incharges Computations (3 prominent leaders)
  const boothInchargesData = useMemo(() => {
    const booths = ["Booth 145", "Booth 146", "Booth 147"];
    const names = ["M. Venkaiah Chowdary", "K. Prasada Reddy", "P. Srinivasa Naidu"];
    const mobiles = ["9848022145", "9848522146", "9848922147"];
    
    return booths.map((bName, idx) => {
      const boothVoters = voters.filter(v => v.boothNumber === bName && v.voterStatus !== 'Deceased');
      
      const counts: Record<VoterPreference, number> = {
        TDP: 0, YSRCP: 0, JSP: 0, BJP: 0, INC: 0, Neutral: 0, OTH: 0
      };
      
      boothVoters.forEach(v => {
        const p = v.politicalPreference || 'Neutral';
        if (counts[p] !== undefined) counts[p]++;
      });
      
      const politicalContenders = Object.entries(counts)
        .filter(([p]) => p !== 'Neutral' && p !== 'OTH')
        .sort((a, b) => b[1] - a[1]);
        
      const leaderParty = politicalContenders[0] ? (politicalContenders[0][0] as VoterPreference) : 'Neutral' as VoterPreference;
      const runnerParty = politicalContenders[1] ? (politicalContenders[1][0] as VoterPreference) : 'Neutral' as VoterPreference;
      const leaderCount = counts[leaderParty] || 0;
      const runnerCount = counts[runnerParty] || 0;
      const lead = leaderCount - runnerCount;
      
      return {
        serial: \`#0\${idx + 1}\`,
        name: names[idx],
        mobile: mobiles[idx],
        booth: bName,
        totalVoters: boothVoters.length,
        counts,
        majorityParty: leaderParty,
        majorityCount: counts[leaderParty] || 0,
        majorityLead: lead
      };
    });
  }, [voters]);`;

const newBooths = `  // Booth Incharges Computations
  const boothInchargesData = useMemo(() => {
    const boothCadres = ALL_CADRES.filter(c => c.role === 'BOOTH_PRESIDENT');
    
    return boothCadres.map((cadre, idx) => {
      const bName = cadre.group;
      const boothVoters = voters.filter(v => v.boothNumber === bName && v.voterStatus !== 'Deceased');
      
      const counts: Record<VoterPreference, number> = {
        TDP: 0, YSRCP: 0, JSP: 0, BJP: 0, INC: 0, Neutral: 0, OTH: 0
      };
      
      boothVoters.forEach(v => {
        const p = v.politicalPreference || 'Neutral';
        if (counts[p] !== undefined) counts[p]++;
      });
      
      const politicalContenders = Object.entries(counts)
        .filter(([p]) => p !== 'Neutral' && p !== 'OTH')
        .sort((a, b) => b[1] - a[1]);
        
      const leaderParty = politicalContenders[0] ? (politicalContenders[0][0] as VoterPreference) : 'Neutral' as VoterPreference;
      const runnerParty = politicalContenders[1] ? (politicalContenders[1][0] as VoterPreference) : 'Neutral' as VoterPreference;
      const leaderCount = counts[leaderParty] || 0;
      const runnerCount = counts[runnerParty] || 0;
      const lead = leaderCount - runnerCount;
      
      return {
        serial: \`#\${String(idx + 1).padStart(2, '0')}\`,
        name: cadre.name,
        mobile: "9440" + (10000 + idx), // deterministic mobile
        booth: bName,
        totalVoters: boothVoters.length,
        counts,
        majorityParty: leaderParty,
        majorityCount: counts[leaderParty] || 0,
        majorityLead: lead
      };
    });
  }, [voters, ALL_CADRES]);`;

code = code.replace(origBooths, newBooths);
fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
