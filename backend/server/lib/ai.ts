import { GoogleGenAI } from '@google/genai';
import { prisma } from './prisma.js';
import { createDashboardSnapshot, getDescendantUnitIds } from './dashboard.js';

const aiClient = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function generateStrategicIntelligence(unitId: string, prompt: string) {
  const cms = await prisma.cMSConfiguration.findUnique({ where: { configKey: 'default' } });
  if (!cms?.aiEnabled && process.env.NODE_ENV === 'production') {
    throw new Error('AI intelligence is disabled in CMS configuration');
  }

  const [unit, allUnits] = await Promise.all([
    prisma.organizationUnit.findUnique({ where: { id: unitId } }),
    prisma.organizationUnit.findMany({ select: { id: true, parentId: true } }),
  ]);

  if (!unit) {
    throw new Error('Unit not found');
  }

  const scopedUnitIds = getDescendantUnitIds(unitId, allUnits);
  const voters = await prisma.voter.findMany({
    where: { unitId: { in: scopedUnitIds } },
  });
  const units = await prisma.organizationUnit.findMany();

  const snapshot = createDashboardSnapshot(unit, units, voters);
  const context = {
    unit: { id: unit.id, name: unit.name, level: unit.level },
    snapshot,
    voterSampleSize: voters.length,
    flaggedVoters: voters.filter((voter) => ['FAKE', 'DUPLICATE', 'DOUBTFUL'].includes(voter.voterStatus)).slice(0, 20).map((voter) => ({
      epicNumber: voter.epicNumber,
      name: voter.name,
      voterStatus: voter.voterStatus,
      notes: voter.notes,
    })),
  };

  if (!aiClient) {
    return {
      provider: 'fallback',
      answer: buildFallbackAnswer(unit.name, snapshot, prompt),
      contextSummary: context,
    };
  }

  const response = await aiClient.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [{
          text: `You are a political campaign intelligence analyst for the Kondapi Assembly constituency in Andhra Pradesh.
Use only the provided operational data. Be concise, actionable, and field-oriented.

DATA:
${JSON.stringify(context, null, 2)}

USER QUESTION:
${prompt}`,
        }],
      },
    ],
  });

  const answer = response.text?.trim() || buildFallbackAnswer(unit.name, snapshot, prompt);

  return {
    provider: 'gemini',
    answer,
    contextSummary: context,
  };
}

function buildFallbackAnswer(unitName: string, snapshot: ReturnType<typeof createDashboardSnapshot>, prompt: string) {
  const { summary, politicalPreference } = snapshot;
  const tdp = politicalPreference.TDP ?? 0;
  const ysrcp = politicalPreference.YSRCP ?? 0;
  const lead = tdp - ysrcp;
  const turnout = summary.totalVoters > 0 ? Math.round((summary.voted / summary.totalVoters) * 100) : 0;

  return `Strategic briefing for ${unitName}:
- Total voters: ${summary.totalVoters}; turnout: ${turnout}% (${summary.voted} voted, ${summary.remaining} remaining)
- Preference lead: TDP ${tdp} vs YSRCP ${ysrcp} (${lead >= 0 ? 'TDP leading' : 'YSRCP leading'} by ${Math.abs(lead)})
- Data quality flags: ${summary.fakeVoters} fake, ${summary.migrated} migrated
- Focus: prioritize booths with low turnout and verify flagged voter records before evening push.

Question addressed: ${prompt}`;
}
