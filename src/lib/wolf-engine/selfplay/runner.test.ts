import { describe, expect, it } from 'vitest';
import { runSelfPlayBatch } from './runner';

describe('runSelfPlayBatch', () => {
  it('runs batch self-play and returns deterministic match results', () => {
    const report = runSelfPlayBatch({ seeds: [0, 1, 2], wolfStrategyId: 'a', goodStrategyId: 'b' });
    expect(report.games).toHaveLength(3);
    expect(report.games[0]).toHaveProperty('winner');
    expect(report.games[0]).toHaveProperty('rounds');
  });

  it('changes deterministic outcomes when strategy aggressiveness changes', () => {
    const seeds = Array.from({ length: 20 }, (_, idx) => idx);
    const highWolf = runSelfPlayBatch({
      seeds,
      wolfStrategyId: 'wolf-high',
      goodStrategyId: 'good-mid',
      wolfStrategy: { aggressiveness: 0.9 },
      goodStrategy: { aggressiveness: 0.5 },
    });

    const lowWolf = runSelfPlayBatch({
      seeds,
      wolfStrategyId: 'wolf-low',
      goodStrategyId: 'good-mid',
      wolfStrategy: { aggressiveness: 0.1 },
      goodStrategy: { aggressiveness: 0.5 },
    });

    const winnerDiffCount = highWolf.games.reduce((count, game, index) => {
      return count + (game.winner !== lowWolf.games[index].winner ? 1 : 0);
    }, 0);

    expect(winnerDiffCount).toBeGreaterThan(0);
  });
});
