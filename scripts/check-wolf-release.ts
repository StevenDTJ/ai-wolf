/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require('child_process');

function runNpmStep(label: string, npmArgs: string[]) {
  console.log(`\n[wolf-release] ${label}`);

  const command = process.platform === 'win32' ? 'cmd' : 'npm';
  const args = process.platform === 'win32' ? ['/c', 'npm', ...npmArgs] : npmArgs;

  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (typeof result.status === 'number' && result.status !== 0) {
    console.error(`\n[wolf-release] FAILED at step: ${label}`);
    process.exit(result.status);
  }

  if (result.error) {
    console.error(`\n[wolf-release] ERROR at step: ${label}`);
    console.error(result.error.message || result.error);
    process.exit(1);
  }
}

function runWolfReleaseCheck() {
  runNpmStep('invariants + rule tests', [
    'test',
    '--',
    'src/lib/wolf-engine/invariants.test.ts',
    'src/hooks/useWolfGame.test.ts',
    'src/lib/wolf-engine/gameLogic.test.ts',
  ]);

  runNpmStep('golden replay tests', [
    'test',
    '--',
    'src/lib/wolf-engine/replay.test.ts',
  ]);

  runNpmStep('20-game simulation tests', [
    'test',
    '--',
    'src/lib/wolf-engine/simulation.test.ts',
  ]);

  console.log('\n[wolf-release] PASS: all release gate checks passed.');
}

runWolfReleaseCheck();
