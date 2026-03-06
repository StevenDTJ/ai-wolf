import { describe, expect, it } from 'vitest';
import { evaluateSelfPlayBatch, scoreCandidate } from './evaluator';

describe('scoreCandidate', () => {
  it('computes composite score with hard-penalty on violations', () => {
    const metrics = {
      winRate: 0.8,
      keyDecision: 0.8,
      robustness: 0.8,
      violations: 2,
      violationPenalty: 1.2,
    };
    const score = scoreCandidate(metrics);
    expect(score).toBeLessThan(0);
  });

  it('evaluates selfplay batch into metrics and score', () => {
    const summary = evaluateSelfPlayBatch({
      games: [
        {
          seed: 1,
          wolfStrategyId: 'w',
          goodStrategyId: 'g',
          terminated: true,
          failureReason: null,
          winner: 'wolf',
          rounds: 8,
        },
        {
          seed: 2,
          wolfStrategyId: 'w',
          goodStrategyId: 'g',
          terminated: true,
          failureReason: null,
          winner: 'good',
          rounds: 10,
        },
        {
          seed: 3,
          wolfStrategyId: 'w',
          goodStrategyId: 'g',
          terminated: false,
          failureReason: 'strategy_simulation_failure',
          winner: null,
          rounds: 0,
        },
      ],
    });

    expect(summary.metrics.violations).toBe(1);
    expect(summary.metrics.robustness).toBeLessThan(1);
    expect(summary.score).toBeLessThan(1);
  });
});
