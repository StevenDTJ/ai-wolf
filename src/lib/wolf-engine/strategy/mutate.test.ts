import { describe, expect, it } from 'vitest';
import { mutateStrategy } from './mutate';
import { StrategyBundle } from './types';

const base: StrategyBundle = {
  id: 'strategy-baseline-v1',
  createdAt: '2026-03-06T00:00:00.000Z',
  wolf: { promptSuffix: '默认狼人策略', aggressiveness: 0.5 },
  good: { promptSuffix: '默认好人策略', aggressiveness: 0.5 },
};

describe('mutateStrategy', () => {
  it('creates candidate strategy with new id and parent id', () => {
    const candidate = mutateStrategy(base, 1);
    expect(candidate.parentId).toBe(base.id);
    expect(candidate.id).toContain('candidate');
  });
});
