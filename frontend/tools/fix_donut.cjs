const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

code = code.replace(
  /const donutChartData = useMemo\(\(\) => \{[\s\S]*?\}, \[partyStats\]\);/,
  `const donutChartData = useMemo(() => {
    return (Object.keys(partyStats) as VoterPreference[]).map(key => {
      const value = partyStats[key];
      const percentage = surveyedVotersCount > 0 ? (value / surveyedVotersCount) * 100 : 0;
      return {
        key,
        value,
        percentage,
        color: PARTY_COLORS[key]
      };
    });
  }, [partyStats, surveyedVotersCount]);`
);
fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
