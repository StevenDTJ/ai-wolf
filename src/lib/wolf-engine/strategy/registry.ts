import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StrategyBundle } from './types';

const STRATEGY_DIRS = [
  resolve(__dirname, '__fixtures__'),
  resolve(process.cwd(), 'reports', 'strategies'),
];

export function loadStrategyById(id: string): StrategyBundle {
  for (const directory of STRATEGY_DIRS) {
    if (!existsSync(directory)) {
      continue;
    }

    const files = readdirSync(directory).filter(file => file.endsWith('.strategy.json'));
    for (const file of files) {
      const filePath = resolve(directory, file);
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const strategy = JSON.parse(raw) as StrategyBundle;
        if (strategy.id === id) {
          return strategy;
        }
      } catch {
        // Ignore malformed strategy files while scanning.
      }
    }
  }

  throw new Error(`Unknown strategy id: ${id}`);
}
