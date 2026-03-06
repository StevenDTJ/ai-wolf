import type { SelfPlayBatchReport } from './runner';

export type EvalMetrics = {
  winRate: number;
  keyDecision: number;
  robustness: number;
  violations: number;
  violationPenalty: number;
};

export type EvalSummary = {
  metrics: EvalMetrics;
  score: number;
};

export function scoreCandidate(metrics: EvalMetrics): number {
  return 0.45 * metrics.winRate + 0.3 * metrics.keyDecision + 0.25 * metrics.robustness - metrics.violationPenalty;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function evaluateSelfPlayBatch(report: SelfPlayBatchReport): EvalSummary {
  const total = report.games.length;
  const violations = report.games.filter(game => !game.terminated || game.failureReason !== null).length;
  const terminatedGames = report.games.filter(game => game.terminated);
  const wolfWins = terminatedGames.filter(game => game.winner === 'wolf').length;
  const avgRounds = terminatedGames.length > 0
    ? terminatedGames.reduce((sum, game) => sum + game.rounds, 0) / terminatedGames.length
    : 20;

  const metrics: EvalMetrics = {
    winRate: total > 0 ? clamp01(wolfWins / total) : 0,
    keyDecision: clamp01(1 - avgRounds / 20),
    robustness: total > 0 ? clamp01(1 - violations / total) : 0,
    violations,
    violationPenalty: violations > 0 ? 1 : 0,
  };

  return {
    metrics,
    score: scoreCandidate(metrics),
  };
}
