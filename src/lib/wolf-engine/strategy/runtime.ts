import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function getProductionStrategyId(): string {
  if (process.env.WOLF_STRATEGY_ID) {
    return process.env.WOLF_STRATEGY_ID;
  }

  const decisionPath = resolve(process.cwd(), 'reports', 'production-strategy.json');
  if (existsSync(decisionPath)) {
    try {
      const decision = JSON.parse(readFileSync(decisionPath, 'utf-8')) as { strategyId?: string };
      if (decision.strategyId) {
        return decision.strategyId;
      }
    } catch {
      // Fall back to env/default when report is malformed.
    }
  }
  return 'strategy-baseline-v1';
}
