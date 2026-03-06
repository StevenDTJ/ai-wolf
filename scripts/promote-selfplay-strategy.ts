/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function main() {
  const { buildPromotionDecision } = await import('../src/lib/wolf-engine/selfplay/promotion.ts');

  const reportsDir = path.resolve(__dirname, '../reports');
  const baselinePath = path.join(reportsDir, 'selfplay-eval-baseline.json');
  const candidatePath = path.join(reportsDir, 'selfplay-eval-candidate.json');

  if (!fs.existsSync(baselinePath) || !fs.existsSync(candidatePath)) {
    console.error('[selfplay-promote] missing eval reports. Run npm run selfplay:eval first.');
    process.exit(1);
  }

  const baseline = readJson(baselinePath);
  const candidate = readJson(candidatePath);
  const decision = buildPromotionDecision(baseline, candidate);

  fs.mkdirSync(reportsDir, { recursive: true });
  const decisionPath = path.join(reportsDir, 'selfplay-promotion-decision.json');
  fs.writeFileSync(decisionPath, JSON.stringify({ ...decision, decidedAt: new Date().toISOString() }, null, 2), 'utf-8');

  const runtimePath = path.join(reportsDir, 'production-strategy.json');
  fs.writeFileSync(runtimePath, JSON.stringify({ strategyId: decision.productionStrategyId, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');

  if (!decision.promoted) {
    console.log('[selfplay-promote] rejected.');
    console.log(`[selfplay-promote] uplift=${decision.uplift.toFixed(4)} gatePassed=${decision.gatePassed}`);
    console.log(`[selfplay-promote] production strategy remains ${decision.productionStrategyId}`);
    return;
  }

  console.log('[selfplay-promote] approved.');
  console.log(`[selfplay-promote] uplift=${decision.uplift.toFixed(4)} gatePassed=${decision.gatePassed}`);
  console.log(`[selfplay-promote] production strategy updated to ${decision.productionStrategyId}`);
}

main();
