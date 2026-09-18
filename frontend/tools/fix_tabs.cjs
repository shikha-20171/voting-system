const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

const match = code.match(/type TabType =[\s\S]*?;/);
if (match) {
  code = code.replace(match[0], 
`type TabType = 
  | 'dashboard'
  | 'village_list'
  | 'booth_incharge_list'
  | 'voters' 
  | 'live_track' 
  | 'fake_votes' 
  | 'tasks' 
  | 'caste_analytics' 
  | 'cadre_network' 
  | 'training';`);
  fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
}
