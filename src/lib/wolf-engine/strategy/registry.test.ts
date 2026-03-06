import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadStrategyById } from './registry';

describe('strategy registry', () => {
  const reportsStrategyDir = resolve(process.cwd(), 'reports', 'strategies');
  const candidatePath = resolve(reportsStrategyDir, 'strategy-baseline-v1-candidate.strategy.json');

  function cleanupCandidate(): void {
    if (existsSync(candidatePath)) {
      rmSync(candidatePath, { force: true });
    }
  }

  it('loads baseline strategy bundle by id', () => {
    const strategy = loadStrategyById('strategy-baseline-v1');
    expect(strategy.id).toBe('strategy-baseline-v1');
  });

  it('loads candidate strategy bundle from scanned strategy directory', () => {
    cleanupCandidate();
    mkdirSync(reportsStrategyDir, { recursive: true });
    writeFileSync(
      candidatePath,
      JSON.stringify({
        id: 'strategy-baseline-v1-candidate',
        parentId: 'strategy-baseline-v1',
        createdAt: '2026-03-06T00:00:00.000Z',
        wolf: { promptSuffix: 'candidate wolf', aggressiveness: 0.7 },
        good: { promptSuffix: 'candidate good', aggressiveness: 0.4 },
      }),
      'utf-8'
    );

    const strategy = loadStrategyById('strategy-baseline-v1-candidate');
    expect(strategy.id).toBe('strategy-baseline-v1-candidate');

    cleanupCandidate();
  });
});
