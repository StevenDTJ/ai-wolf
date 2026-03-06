import { describe, it, expect } from 'vitest';
import { runSimulation, runSingleDeterministicGame } from './simulation';

describe('wolf 20-game simulation stability', () => {
  it('simulates 20 deterministic games without invariant failures and all terminated', () => {
    const result = runSimulation({ games: 20, seedStart: 0 });

    expect(result.failures).toEqual([]);
    expect(result.terminatedGames).toBe(20);
  });

  it('changes deterministic outcome when strategy inputs differ', () => {
    const seeds = Array.from({ length: 25 }, (_, idx) => idx);
    const changed = seeds.some(seed => {
      const lowAgg = runSingleDeterministicGame(seed, { wolfAggressiveness: 0.2, goodAggressiveness: 0.8 });
      const highAgg = runSingleDeterministicGame(seed, { wolfAggressiveness: 0.9, goodAggressiveness: 0.2 });
      return lowAgg.winner !== highAgg.winner;
    });

    expect(changed).toBe(true);
  });
});
