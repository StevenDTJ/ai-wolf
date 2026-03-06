import { describe, expect, it } from 'vitest';
import { loadStrategyById } from './registry';

describe('strategy registry', () => {
  it('loads baseline strategy bundle by id', () => {
    const strategy = loadStrategyById('strategy-baseline-v1');
    expect(strategy.id).toBe('strategy-baseline-v1');
  });
});
