import { runSingleDeterministicGame } from '../simulation';

export type SelfPlayBatchInput = {
  seeds: number[];
  wolfStrategyId: string;
  goodStrategyId: string;
};

export type SelfPlayGameResult = {
  seed: number;
  wolfStrategyId: string;
  goodStrategyId: string;
  terminated: boolean;
  failureReason: string | null;
};

export type SelfPlayBatchReport = {
  games: SelfPlayGameResult[];
};

export function runSelfPlayBatch(input: SelfPlayBatchInput): SelfPlayBatchReport {
  const games = input.seeds.map(seed => {
    const result = runSingleDeterministicGame(seed);
    return {
      seed,
      wolfStrategyId: input.wolfStrategyId,
      goodStrategyId: input.goodStrategyId,
      terminated: result.terminated,
      failureReason: result.failure?.reason ?? null,
    };
  });

  return { games };
}
