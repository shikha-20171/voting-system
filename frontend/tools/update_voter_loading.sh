#!/bin/bash
file="src/components/MandalInchargeDashboard.tsx"

# Replace data loading
sed -i 's/const allVoters = loadAllVillageVoters();/let allVoters: Voter[] = [];\n    SINGARAYAKONDA_VILLAGES.forEach(v => {\n      allVoters = [...allVoters, ...generateVotersForMandalVillage(v.name)];\n    });/g' $file

# Replace saving
sed -i 's/saveVoterRecord(updated);/saveMandalVoterRecord(editingVoter.village, updated);/g' $file

