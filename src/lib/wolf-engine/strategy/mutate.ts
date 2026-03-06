import { StrategyBundle } from './types';

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function mutateStrategy(base: StrategyBundle, seed: number): StrategyBundle {
  const delta = ((seed % 5) - 2) * 0.02;

  return {
    ...base,
    id: `${base.id}-candidate-${seed}`,
    parentId: base.id,
    createdAt: new Date(Date.UTC(2026, 2, 6, 0, 0, seed)).toISOString(),
    wolf: {
      ...base.wolf,
      aggressiveness: clamp01((base.wolf.aggressiveness ?? 0.5) + delta),
      promptSuffix: `${base.wolf.promptSuffix ?? ''} [candidate-${seed}]`.trim(),
    },
    good: {
      ...base.good,
      aggressiveness: clamp01((base.good.aggressiveness ?? 0.5) - delta),
      promptSuffix: `${base.good.promptSuffix ?? ''} [candidate-${seed}]`.trim(),
    },
  };
}
