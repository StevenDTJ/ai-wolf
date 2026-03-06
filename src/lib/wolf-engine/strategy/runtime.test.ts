import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getProductionStrategyId } from './runtime';

describe('strategy runtime', () => {
  const reportPath = resolve(process.cwd(), 'reports', 'production-strategy.json');

  afterEach(() => {
    if (existsSync(reportPath)) {
      rmSync(reportPath, { force: true });
    }
    delete process.env.WOLF_STRATEGY_ID;
  });

  it('uses production strategy report when env is not set', () => {
    mkdirSync(resolve(process.cwd(), 'reports'), { recursive: true });
    writeFileSync(reportPath, JSON.stringify({ strategyId: 'strategy-live-v2' }), 'utf-8');

    expect(getProductionStrategyId()).toBe('strategy-live-v2');
  });

  it('prefers explicit env strategy id over report', () => {
    mkdirSync(resolve(process.cwd(), 'reports'), { recursive: true });
    writeFileSync(reportPath, JSON.stringify({ strategyId: 'strategy-live-v2' }), 'utf-8');
    process.env.WOLF_STRATEGY_ID = 'strategy-env-v1';

    expect(getProductionStrategyId()).toBe('strategy-env-v1');
  });
});
