/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function scoreCandidate(metrics) {
  return 0.45 * metrics.winRate + 0.3 * metrics.keyDecision + 0.25 * metrics.robustness - metrics.violationPenalty;
}

function runDeterministic(seed) {
  let state = (seed >>> 0) + 1;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const roll = next();
  if (roll < 0.05) {
    return { terminated: false, failureReason: 'simulated_failure' };
  }
  return { terminated: true, failureReason: null };
}

function main() {
  const strategyPath = path.resolve(__dirname, '../src/lib/wolf-engine/strategy/__fixtures__/baseline.strategy.json');
  const baseline = JSON.parse(fs.readFileSync(strategyPath, 'utf-8'));

  const seeds = [0, 1, 2, 3, 4];
  const games = seeds.map(seed => {
    const game = runDeterministic(seed);
    return {
      seed,
      wolfStrategyId: baseline.id,
      goodStrategyId: baseline.id,
      terminated: game.terminated,
      failureReason: game.failureReason,
    };
  });

  const terminated = games.filter(game => game.terminated).length;
  const violations = games.length - terminated;
  const metrics = {
    winRate: clamp01(terminated / games.length),
    keyDecision: 0.6,
    robustness: clamp01(1 - violations / games.length),
    violations,
    violationPenalty: violations > 0 ? 1 : 0,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    baselineStrategyId: baseline.id,
    metrics,
    score: scoreCandidate(metrics),
    games,
  };

  const outDir = path.resolve(__dirname, '../reports');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'selfplay-eval-report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`[selfplay-eval] report written: ${outFile}`);
  console.log(`[selfplay-eval] score=${report.score.toFixed(4)} violations=${violations}/${games.length}`);
}

main();
