const fs = require('fs');
let code = fs.readFileSync('src/components/MandalInchargeDashboard.tsx', 'utf8');

code = code.replace(/import \{\s*loadAllVillageVoters,\s*saveVoterRecord,\s*INCHARGES,\s*TRAINING_VIDEOS,\s*INITIAL_BOOTH_TASKS,\s*getBoothForIncharge\s*\} from '\.\.\/utils\/boothHelpers';/,
`import { 
  TRAINING_VIDEOS,
  INITIAL_BOOTH_TASKS
} from '../utils/boothHelpers';
import { 
  SINGARAYAKONDA_VILLAGES, 
  getMandalCadreNetwork, 
  generateVotersForMandalVillage, 
  saveMandalVoterRecord 
} from '../utils/mandalHelpers';`);

fs.writeFileSync('src/components/MandalInchargeDashboard.tsx', code);
