export function canPromote(input: { uplift: number; gatePassed: boolean }): boolean {
  return input.gatePassed && input.uplift >= 0.05;
}

export type SelfPlayEvalReport = {
  strategyId: string;
  score: number;
  metrics: {
    violations: number;
  };
};

export type PromotionDecision = {
  promoted: boolean;
  uplift: number;
  gatePassed: boolean;
  baselineScore: number;
  candidateScore: number;
  baselineStrategyId: string;
  candidateStrategyId: string;
  productionStrategyId: string;
};

export function buildPromotionDecision(
  baseline: SelfPlayEvalReport,
  candidate: SelfPlayEvalReport
): PromotionDecision {
  const baselineScore = baseline.score;
  const candidateScore = candidate.score;
  const uplift = baselineScore === 0 ? 0 : (candidateScore - baselineScore) / Math.abs(baselineScore);
  const gatePassed = baseline.metrics.violations === 0 && candidate.metrics.violations === 0;
  const promoted = canPromote({ uplift, gatePassed });

  return {
    promoted,
    uplift,
    gatePassed,
    baselineScore,
    candidateScore,
    baselineStrategyId: baseline.strategyId,
    candidateStrategyId: candidate.strategyId,
    productionStrategyId: promoted ? candidate.strategyId : baseline.strategyId,
  };
}
