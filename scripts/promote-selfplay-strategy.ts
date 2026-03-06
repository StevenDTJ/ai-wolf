/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');

function canPromote(input) {
  return input.gatePassed && input.uplift >= 0.05;
}

function main() {
  const reportPath = path.resolve(__dirname, '../reports/selfplay-eval-report.json');
  if (!fs.existsSync(reportPath)) {
    console.error('[selfplay-promote] missing eval report. Run npm run selfplay:eval first.');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const baselineScore = Number(process.env.SELFPLAY_BASELINE_SCORE ?? report.score ?? 0);
  const candidateScore = Number(process.env.SELFPLAY_CANDIDATE_SCORE ?? report.score ?? 0);
  const uplift = baselineScore === 0 ? 0 : (candidateScore - baselineScore) / Math.abs(baselineScore);
  const gatePassed = String(process.env.SELFPLAY_GATE_PASSED ?? 'true') === 'true';
  const promotionOk = canPromote({ uplift, gatePassed });

  const out = {
    promoted: promotionOk,
    uplift,
    gatePassed,
    baselineScore,
    candidateScore,
    decidedAt: new Date().toISOString(),
  };

  const runtimeDir = path.resolve(__dirname, '../reports');
  fs.mkdirSync(runtimeDir, { recursive: true });
  const decisionPath = path.join(runtimeDir, 'selfplay-promotion-decision.json');
  fs.writeFileSync(decisionPath, JSON.stringify(out, null, 2), 'utf-8');

  if (!promotionOk) {
    console.log('[selfplay-promote] rejected.');
    console.log(`[selfplay-promote] uplift=${uplift.toFixed(4)} gatePassed=${gatePassed}`);
    return;
  }

  console.log('[selfplay-promote] approved.');
  console.log(`[selfplay-promote] uplift=${uplift.toFixed(4)} gatePassed=${gatePassed}`);
}

main();
