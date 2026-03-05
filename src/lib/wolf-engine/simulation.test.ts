import { describe, it, expect } from 'vitest';
import { runSimulation } from './simulation';

describe('wolf 20-game simulation stability', () => {
  it('simulates 20 deterministic games without invariant failures and all terminated', () => {
    const result = runSimulation({ games: 20, seedStart: 0 });

    expect(result.failures).toEqual([]);
    expect(result.terminatedGames).toBe(20);
  });
});
