# WolfGame 8P Stability Release Checklist

Date: 2026-03-06

## Verification Evidence

| Check | Command | Result | Evidence |
| --- | --- | --- | --- |
| Rule tests (focused suite) | `cmd /c npm test -- src/hooks/useWolfGame.test.ts src/lib/wolf-engine/aiClient.test.ts src/lib/wolf-engine/buildContext.test.ts src/lib/wolf-engine/gameLogic.test.ts src/lib/wolf-engine/replay.test.ts src/lib/wolf-engine/simulation.test.ts` | PASS | 6 files passed, 23 tests passed |
| Rule tests (release gate step 1) | `cmd /c npm test -- src/lib/wolf-engine/invariants.test.ts src/hooks/useWolfGame.test.ts src/lib/wolf-engine/gameLogic.test.ts` | PASS | 3 files passed, 16 tests passed |
| Golden replay | `cmd /c npm test -- src/lib/wolf-engine/replay.test.ts` | PASS | 1 file passed, 3 tests passed |
| 20-game simulation | `cmd /c npm test -- src/lib/wolf-engine/simulation.test.ts` | PASS | 1 file passed, 1 test passed |
| Release gate command | `cmd /c npm run check:wolf:release` | PASS | all 3 gate steps passed and script exited 0 |

## Gate Conclusion

- Rule tests: PASS
- Golden replay: PASS
- 20-game simulation: PASS
- `check:wolf:release`: PASS

Wolf 8P stability release gate is healthy on current branch.
