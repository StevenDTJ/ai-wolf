# WolfGame 8P Stability Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a release-blocking stability pipeline for 8-player Werewolf (rules correctness + golden replay + 20-game simulation).

**Architecture:** Add an engine-level invariant checker and validate every critical phase transition. Then add deterministic golden replay tests for high-risk branches. Finally add a lightweight simulation runner that executes 20 complete games and fails on any invalid state/log anomaly.

**Tech Stack:** TypeScript, Vitest, existing wolf-engine modules, npm scripts.

---

### Task 1: Add invariant checker module

**Files:**
- Create: `src/lib/wolf-engine/invariants.ts`
- Create: `src/lib/wolf-engine/invariants.test.ts`
- Modify: `src/lib/wolf-engine/index.ts`

**Step 1: Write failing tests**
- Add tests for:
  - dead player cannot appear in alive list
  - werewolf kill target must be alive non-wolf
  - no duplicate death in one resolution

**Step 2: Run failing tests**
- Run: `cmd /c npm test -- src/lib/wolf-engine/invariants.test.ts`
- Expected: FAIL (module/function missing)

**Step 3: Implement minimal checker**
- Implement `validateInvariants(state: WolfGameState): string[]`.
- Return string errors, empty array means valid.

**Step 4: Re-run tests**
- Run: `cmd /c npm test -- src/lib/wolf-engine/invariants.test.ts`
- Expected: PASS

**Step 5: Commit**
- `git add src/lib/wolf-engine/invariants.ts src/lib/wolf-engine/invariants.test.ts src/lib/wolf-engine/index.ts`
- `git commit -m "test: add wolf-engine invariant validator"`

### Task 2: Enforce invariants on critical transitions

**Files:**
- Modify: `src/hooks/useWolfGame.ts`
- Modify: `src/lib/wolf-engine/gameLogic.ts`
- Test: `src/hooks/useWolfGame.test.ts`

**Step 1: Write failing tests**
- Add test cases for:
  - werewolf target parse ignores dead players
  - transition to day/night does not produce invariant errors

**Step 2: Run failing tests**
- Run: `cmd /c npm test -- src/hooks/useWolfGame.test.ts`
- Expected: FAIL before checks are wired

**Step 3: Implement transition checks**
- After `processWerewolfKill`, `processWitchDecision`, `startNextRound`, run `validateInvariants` and throw/record error if non-empty.

**Step 4: Re-run tests**
- Run: `cmd /c npm test -- src/hooks/useWolfGame.test.ts`
- Expected: PASS

**Step 5: Commit**
- `git add src/hooks/useWolfGame.ts src/lib/wolf-engine/gameLogic.ts src/hooks/useWolfGame.test.ts`
- `git commit -m "fix: enforce invariants across wolf phase transitions"`

### Task 3: Build golden replay harness

**Files:**
- Create: `src/lib/wolf-engine/replay.ts`
- Create: `src/lib/wolf-engine/replay.test.ts`
- Create: `src/lib/wolf-engine/__fixtures__/golden/night-witch-save.json`
- Create: `src/lib/wolf-engine/__fixtures__/golden/hunter-day-kill.json`
- Create: `src/lib/wolf-engine/__fixtures__/golden/tie-vote-no-elim.json`

**Step 1: Write failing replay tests**
- Each fixture defines input state/actions and expected event sequence.

**Step 2: Run failing tests**
- Run: `cmd /c npm test -- src/lib/wolf-engine/replay.test.ts`
- Expected: FAIL (replay harness missing)

**Step 3: Implement replay harness**
- Implement deterministic replay executor returning event timeline.
- Compare timeline against expected snapshot from fixture.

**Step 4: Re-run tests**
- Run: `cmd /c npm test -- src/lib/wolf-engine/replay.test.ts`
- Expected: PASS

**Step 5: Commit**
- `git add src/lib/wolf-engine/replay.ts src/lib/wolf-engine/replay.test.ts src/lib/wolf-engine/__fixtures__/golden`
- `git commit -m "test: add golden replay harness for wolf critical branches"`

### Task 4: Add 20-game simulation runner

**Files:**
- Create: `src/lib/wolf-engine/simulation.ts`
- Create: `src/lib/wolf-engine/simulation.test.ts`
- Modify: `package.json`

**Step 1: Write failing test**
- Add test: simulate N=20 with deterministic seed range, assert no invalid state and all games terminate.

**Step 2: Run failing test**
- Run: `cmd /c npm test -- src/lib/wolf-engine/simulation.test.ts`
- Expected: FAIL

**Step 3: Implement simulation runner**
- Implement `runSimulation({ games: 20 }): { failures: SimulationFailure[] }`.
- Use existing engine transitions and invariant checker each step.

**Step 4: Re-run test**
- Run: `cmd /c npm test -- src/lib/wolf-engine/simulation.test.ts`
- Expected: PASS

**Step 5: Add npm script and commit**
- Add script: `"test:wolf:sim": "vitest run src/lib/wolf-engine/simulation.test.ts"`
- `git add src/lib/wolf-engine/simulation.ts src/lib/wolf-engine/simulation.test.ts package.json`
- `git commit -m "test: add 20-game wolf simulation stability gate"`

### Task 5: Add release gate command

**Files:**
- Create: `scripts/check-wolf-release.ts`
- Modify: `package.json`
- Modify: `README.md`

**Step 1: Write failing smoke test (optional)**
- Add tiny test for script exit code logic if test infra exists for scripts.

**Step 2: Implement command**
- Script runs, in order:
  1) invariant + rule tests
  2) replay tests
  3) simulation tests
- Any failure => non-zero exit.

**Step 3: Add npm script**
- `"check:wolf:release": "node scripts/check-wolf-release.ts"`

**Step 4: Verify command manually**
- Run: `cmd /c npm run check:wolf:release`
- Expected: PASS on healthy branch.

**Step 5: Commit**
- `git add scripts/check-wolf-release.ts package.json README.md`
- `git commit -m "chore: add wolf release gate command"`

### Task 6: Final verification bundle

**Files:**
- Modify (if needed): `docs/plans/2026-03-06-wolfgame-8p-stability-design.md`
- Create (optional): `docs/plans/2026-03-06-wolfgame-8p-stability-release-checklist.md`

**Step 1: Run focused suite**
- `cmd /c npm test -- src/hooks/useWolfGame.test.ts src/lib/wolf-engine/aiClient.test.ts src/lib/wolf-engine/buildContext.test.ts src/lib/wolf-engine/gameLogic.test.ts src/lib/wolf-engine/replay.test.ts src/lib/wolf-engine/simulation.test.ts`

**Step 2: Run release gate**
- `cmd /c npm run check:wolf:release`

**Step 3: Capture evidence**
- Record PASS/FAIL table for:
  - Rule tests
  - Golden replay
  - 20-game simulation

**Step 4: Commit docs update**
- `git add docs/plans/2026-03-06-wolfgame-8p-stability-design.md docs/plans/2026-03-06-wolfgame-8p-stability-release-checklist.md`
- `git commit -m "docs: add wolf stability release evidence checklist"`
