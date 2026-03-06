import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StrategyBundle } from './types';

const STRATEGY_FILE_BY_ID: Record<string, string> = {
  'strategy-baseline-v1': 'baseline.strategy.json',
};

export function loadStrategyById(id: string): StrategyBundle {
  const filename = STRATEGY_FILE_BY_ID[id];
  if (!filename) {
    throw new Error(`Unknown strategy id: ${id}`);
  }

  const filePath = resolve(__dirname, '__fixtures__', filename);
  const raw = readFileSync(filePath, 'utf-8');
  const strategy = JSON.parse(raw) as StrategyBundle;
  return strategy;
}
