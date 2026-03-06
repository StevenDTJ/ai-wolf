import { describe, expect, it } from 'vitest';
import { scoreCandidate } from './evaluator';

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
});
