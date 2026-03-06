import type { StrategyTeamConfig } from '../strategy/types';

export type SelfPlayBatchInput = {
  seeds: number[];
  wolfStrategyId: string;
  goodStrategyId: string;
  wolfStrategy?: StrategyTeamConfig;
  goodStrategy?: StrategyTeamConfig;
};

export type SelfPlayGameResult = {
  seed: number;
  wolfStrategyId: string;
  goodStrategyId: string;
  terminated: boolean;
  failureReason: string | null;
  winner: 'wolf' | 'good' | null;
  rounds: number;
};

export type SelfPlayBatchReport = {
  games: SelfPlayGameResult[];
};

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function createRng(seed: number): () => number {
  let state = (seed >>> 0) + 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function runBatchGame(seed: number, wolfAgg: number, goodAgg: number): {
  terminated: boolean;
  failureReason: string | null;
  winner: 'wolf' | 'good' | null;
  rounds: number;
} {
  const rng = createRng(seed + Math.floor(wolfAgg * 1000) - Math.floor(goodAgg * 1000));
  const stabilityRoll = rng();
  const violationThreshold = 0.02 + Math.max(0, goodAgg - wolfAgg) * 0.02;
  if (stabilityRoll < violationThreshold) {
    return {
      terminated: false,
      failureReason: 'strategy_simulation_failure',
      winner: null,
      rounds: 0,
    };
  }

  const wolfPower = rng() + wolfAgg * 0.65;
  const goodPower = rng() + (1 - goodAgg) * 0.3 + goodAgg * 0.35;
  const rounds = 6 + Math.floor((1 - Math.abs(wolfAgg - goodAgg)) * 8 + rng() * 3);

  return {
    terminated: true,
    failureReason: null,
    winner: wolfPower >= goodPower ? 'wolf' : 'good',
    rounds,
  };
}

export function runSelfPlayBatch(input: SelfPlayBatchInput): SelfPlayBatchReport {
  const wolfAgg = clamp01(input.wolfStrategy?.aggressiveness ?? 0.5);
  const goodAgg = clamp01(input.goodStrategy?.aggressiveness ?? 0.5);

  const games = input.seeds.map(seed => {
    const result = runBatchGame(seed, wolfAgg, goodAgg);
    return {
      seed,
      wolfStrategyId: input.wolfStrategyId,
      goodStrategyId: input.goodStrategyId,
      terminated: result.terminated,
      failureReason: result.failureReason,
      winner: result.winner,
      rounds: result.rounds,
    };
  });

  return { games };
}
