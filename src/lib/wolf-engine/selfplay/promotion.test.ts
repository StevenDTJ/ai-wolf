import { describe, expect, it } from 'vitest';
import { buildPromotionDecision, canPromote } from './promotion';

describe('canPromote', () => {
  it('rejects promotion when release gate fails or uplift < 5%', () => {
    expect(canPromote({ uplift: 0.03, gatePassed: true })).toBe(false);
    expect(canPromote({ uplift: 0.08, gatePassed: false })).toBe(false);
  });

  it('compares baseline/candidate reports and picks production strategy id', () => {
    const approved = buildPromotionDecision(
      { strategyId: 'baseline', score: 0.5, metrics: { violations: 0 } },
      { strategyId: 'candidate', score: 0.56, metrics: { violations: 0 } }
    );
    expect(approved.promoted).toBe(true);
    expect(approved.productionStrategyId).toBe('candidate');

    const rejected = buildPromotionDecision(
      { strategyId: 'baseline', score: 0.5, metrics: { violations: 0 } },
      { strategyId: 'candidate', score: 0.7, metrics: { violations: 2 } }
    );
    expect(rejected.promoted).toBe(false);
    expect(rejected.productionStrategyId).toBe('baseline');
  });
});
