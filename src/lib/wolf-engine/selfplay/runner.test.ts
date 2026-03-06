import { describe, expect, it } from 'vitest';
import { runSelfPlayBatch } from './runner';

describe('runSelfPlayBatch', () => {
  it('runs batch self-play and returns deterministic match results', () => {
    const report = runSelfPlayBatch({ seeds: [0, 1, 2], wolfStrategyId: 'a', goodStrategyId: 'b' });
    expect(report.games).toHaveLength(3);
  });
});
