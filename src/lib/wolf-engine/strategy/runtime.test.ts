import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadStrategyById } from './registry';
import { getProductionStrategyId } from './runtime';

describe('strategy runtime', () => {
  const reportPath = resolve(process.cwd(), 'reports', 'production-strategy.json');
  const strategyDir = resolve(process.cwd(), 'reports', 'strategies');
  const candidateId = 'strategy-runtime-test-candidate';
  const candidateStrategyPath = resolve(strategyDir, `${candidateId}.strategy.json`);

  afterEach(() => {
    if (existsSync(reportPath)) {
      rmSync(reportPath, { force: true });
    }
    if (existsSync(candidateStrategyPath)) {
      rmSync(candidateStrategyPath, { force: true });
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

  it('allows registry to load promoted strategy id from runtime report', () => {
    mkdirSync(strategyDir, { recursive: true });
    writeFileSync(reportPath, JSON.stringify({ strategyId: candidateId }), 'utf-8');
    writeFileSync(
      candidateStrategyPath,
      JSON.stringify({
        id: candidateId,
        parentId: 'strategy-baseline-v1',
        createdAt: '2026-03-06T00:00:00.000Z',
        wolf: { aggressiveness: 0.7, promptSuffix: 'candidate wolf' },
        good: { aggressiveness: 0.4, promptSuffix: 'candidate good' },
      }),
      'utf-8'
    );

    const strategy = loadStrategyById(getProductionStrategyId());
    expect(strategy.id).toBe(candidateId);
  });
});
