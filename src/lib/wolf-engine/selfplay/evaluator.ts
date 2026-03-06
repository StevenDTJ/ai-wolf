export type EvalMetrics = {
  winRate: number;
  keyDecision: number;
  robustness: number;
  violations: number;
  violationPenalty: number;
};

export function scoreCandidate(metrics: EvalMetrics): number {
  return 0.45 * metrics.winRate + 0.3 * metrics.keyDecision + 0.25 * metrics.robustness - metrics.violationPenalty;
}
