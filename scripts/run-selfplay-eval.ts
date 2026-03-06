/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function clamp01(value) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

async function main() {
  const { runSelfPlayBatch } = await import('../src/lib/wolf-engine/selfplay/runner.ts');
  const { evaluateSelfPlayBatch } = await import('../src/lib/wolf-engine/selfplay/evaluator.ts');

  const strategyPath = path.resolve(__dirname, '../src/lib/wolf-engine/strategy/__fixtures__/baseline.strategy.json');
  const baseline = readJson(strategyPath);

  const candidate = {
    ...baseline,
    id: `${baseline.id}-candidate`,
    parentId: baseline.id,
    createdAt: new Date().toISOString(),
    wolf: {
      ...baseline.wolf,
      aggressiveness: clamp01((baseline.wolf?.aggressiveness ?? 0.5) + 0.08),
      promptSuffix: `${baseline.wolf?.promptSuffix ?? ''} [candidate]`.trim(),
    },
    good: {
      ...baseline.good,
      aggressiveness: clamp01((baseline.good?.aggressiveness ?? 0.5) - 0.04),
      promptSuffix: `${baseline.good?.promptSuffix ?? ''} [candidate]`.trim(),
    },
  };

  const seeds = Array.from({ length: 20 }, (_, idx) => idx);

  const baselineBatch = runSelfPlayBatch({
    seeds,
    wolfStrategyId: baseline.id,
    goodStrategyId: baseline.id,
    wolfStrategy: baseline.wolf,
    goodStrategy: baseline.good,
  });

  const candidateBatch = runSelfPlayBatch({
    seeds,
    wolfStrategyId: candidate.id,
    goodStrategyId: baseline.id,
    wolfStrategy: candidate.wolf,
    goodStrategy: baseline.good,
  });

  const baselineEval = evaluateSelfPlayBatch(baselineBatch);
  const candidateEval = evaluateSelfPlayBatch(candidateBatch);

  const outDir = path.resolve(__dirname, '../reports');
  fs.mkdirSync(outDir, { recursive: true });

  const baselineReport = {
    generatedAt: new Date().toISOString(),
    strategyId: baseline.id,
    opponentStrategyId: baseline.id,
    metrics: baselineEval.metrics,
    score: baselineEval.score,
    games: baselineBatch.games,
  };

  const candidateReport = {
    generatedAt: new Date().toISOString(),
    strategyId: candidate.id,
    opponentStrategyId: baseline.id,
    metrics: candidateEval.metrics,
    score: candidateEval.score,
    games: candidateBatch.games,
  };

  const baselineOutFile = path.join(outDir, 'selfplay-eval-baseline.json');
  const candidateOutFile = path.join(outDir, 'selfplay-eval-candidate.json');
  fs.writeFileSync(baselineOutFile, JSON.stringify(baselineReport, null, 2), 'utf-8');
  fs.writeFileSync(candidateOutFile, JSON.stringify(candidateReport, null, 2), 'utf-8');

  console.log(`[selfplay-eval] baseline report: ${baselineOutFile}`);
  console.log(`[selfplay-eval] candidate report: ${candidateOutFile}`);
  console.log(`[selfplay-eval] baseline score=${baselineReport.score.toFixed(4)}`);
  console.log(`[selfplay-eval] candidate score=${candidateReport.score.toFixed(4)}`);
}

main();
