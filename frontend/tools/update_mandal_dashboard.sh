#!/bin/bash
file="src/components/MandalInchargeDashboard.tsx"

# Replace imports
sed -i 's/import {.*loadAllVillageVoters,.*saveVoterRecord,.*INCHARGES,.*TRAINING_VIDEOS,.*INITIAL_BOOTH_TASKS,.*getBoothForIncharge.*} from '\''\.\.\/utils\/boothHelpers'\'';/import { TRAINING_VIDEOS, INITIAL_BOOTH_TASKS } from '\''..\/utils\/boothHelpers'\'';\nimport { SINGARAYAKONDA_VILLAGES, getMandalCadreNetwork, generateVotersForMandalVillage, saveMandalVoterRecord } from '\''..\/utils\/mandalHelpers'\'';/g' $file

# Update Cadre Network tabs and states
sed -i 's/cadreActiveTab, setCadreActiveTab\] = useState<'\''booth'\'' | '\''voter'\''>('\''booth'\'');/cadreActiveTab, setCadreActiveTab\] = useState<'\''village'\'' | '\''booth'\'' | '\''voter'\''>('\''village'\'');/g' $file

# Fix Cadre variable
sed -i 's/const allIncharges = INCHARGES;/const { villageIncharges, boothIncharges, voter100Incharges } = getMandalCadreNetwork();/g' $file

