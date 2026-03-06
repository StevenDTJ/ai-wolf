# Wolfgame Self-Play Strategy Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-safe self-play pipeline that evolves 8-player werewolf strategy bundles and only promotes candidates that improve metrics without breaking release gates.

**Architecture:** Add a versioned strategy registry, a deterministic self-play batch runner, and an evaluator that ranks candidates against a production baseline. Introduce a promotion script that requires both metric uplift and `check:wolf:release` pass before switching production strategy id.

**Tech Stack:** TypeScript, Node.js scripts, Vitest, existing `src/lib/wolf-engine` engine, npm scripts.

---

> Suggested supporting skills during execution: `@test-driven-development`, `@systematic-debugging`, `@verification-before-completion`.

### Task 1: Add strategy bundle types and local registry

**Files:**
- Create: `src/lib/wolf-engine/strategy/types.ts`
- Create: `src/lib/wolf-engine/strategy/registry.ts`
- Create: `src/lib/wolf-engine/strategy/__fixtures__/baseline.strategy.json`
- Test: `src/lib/wolf-engine/strategy/registry.test.ts`

**Step 1: Write the failing test**

```ts
it('loads baseline strategy bundle by id', () => {
  const strategy = loadStrategyById('strategy-baseline-v1');
  expect(strategy.id).toBe('strategy-baseline-v1');
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/strategy/registry.test.ts`  
Expected: FAIL with module/function not found

**Step 3: Write minimal implementation**

```ts
export function loadStrategyById(id: string): StrategyBundle {
  // read from local strategy fixture directory
}
```

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-engine/strategy/registry.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/strategy/types.ts src/lib/wolf-engine/strategy/registry.ts src/lib/wolf-engine/strategy/__fixtures__/baseline.strategy.json src/lib/wolf-engine/strategy/registry.test.ts
git commit -m "feat: add self-play strategy registry and types"
```

### Task 2: Add candidate mutation generator

**Files:**
- Create: `src/lib/wolf-engine/strategy/mutate.ts`
- Test: `src/lib/wolf-engine/strategy/mutate.test.ts`

**Step 1: Write the failing test**

```ts
it('creates candidate strategy with new id and parent id', () => {
  const candidate = mutateStrategy(base, 1);
  expect(candidate.parentId).toBe(base.id);
  expect(candidate.id).toContain('candidate');
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/strategy/mutate.test.ts`  
Expected: FAIL with function missing

**Step 3: Write minimal implementation**

```ts
export function mutateStrategy(base: StrategyBundle, seed: number): StrategyBundle {
  // produce small deterministic parameter/prompt mutation
}
```

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-engine/strategy/mutate.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/strategy/mutate.ts src/lib/wolf-engine/strategy/mutate.test.ts
git commit -m "feat: add deterministic strategy mutation generator"
```

### Task 3: Build deterministic self-play runner

**Files:**
- Create: `src/lib/wolf-engine/selfplay/runner.ts`
- Create: `src/lib/wolf-engine/selfplay/runner.test.ts`
- Modify: `src/lib/wolf-engine/simulation.ts`

**Step 1: Write the failing test**

```ts
it('runs batch self-play and returns deterministic match results', () => {
  const report = runSelfPlayBatch({ seeds: [0, 1, 2], wolfStrategyId: 'a', goodStrategyId: 'b' });
  expect(report.games).toHaveLength(3);
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/selfplay/runner.test.ts`  
Expected: FAIL with missing runner

**Step 3: Write minimal implementation**

```ts
export function runSelfPlayBatch(input: SelfPlayBatchInput): SelfPlayBatchReport {
  // call simulation loop with fixed seeds and strategy hooks
}
```

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-engine/selfplay/runner.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/selfplay/runner.ts src/lib/wolf-engine/selfplay/runner.test.ts src/lib/wolf-engine/simulation.ts
git commit -m "feat: add deterministic self-play batch runner"
```

### Task 4: Add evaluator and leaderboard report

**Files:**
- Create: `src/lib/wolf-engine/selfplay/evaluator.ts`
- Create: `src/lib/wolf-engine/selfplay/evaluator.test.ts`
- Create: `scripts/run-selfplay-eval.ts`

**Step 1: Write the failing test**

```ts
it('computes composite score with hard-penalty on violations', () => {
  const score = scoreCandidate(metrics);
  expect(score).toBeLessThan(0); // when violations > 0
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/selfplay/evaluator.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
export function scoreCandidate(metrics: EvalMetrics): number {
  return 0.45 * metrics.winRate + 0.3 * metrics.keyDecision + 0.25 * metrics.robustness - metrics.violationPenalty;
}
```

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-engine/selfplay/evaluator.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/selfplay/evaluator.ts src/lib/wolf-engine/selfplay/evaluator.test.ts scripts/run-selfplay-eval.ts
git commit -m "feat: add self-play evaluator and leaderboard script"
```

### Task 5: Add promotion gate script

**Files:**
- Create: `scripts/promote-selfplay-strategy.ts`
- Modify: `package.json`
- Test: `src/lib/wolf-engine/selfplay/promotion.test.ts`

**Step 1: Write the failing test**

```ts
it('rejects promotion when release gate fails or uplift < 5%', () => {
  expect(canPromote({ uplift: 0.03, gatePassed: true })).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/selfplay/promotion.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
export function canPromote(input: { uplift: number; gatePassed: boolean }): boolean {
  return input.gatePassed && input.uplift >= 0.05;
}
```

**Step 4: Add npm scripts**

- `"selfplay:eval": "node scripts/run-selfplay-eval.ts"`
- `"selfplay:promote": "node scripts/promote-selfplay-strategy.ts"`

**Step 5: Run tests and commit**

Run:
- `cmd /c npm test -- src/lib/wolf-engine/selfplay/promotion.test.ts`
- `cmd /c npm run check:wolf:release`

Expected: PASS

```bash
git add scripts/promote-selfplay-strategy.ts package.json src/lib/wolf-engine/selfplay/promotion.test.ts
git commit -m "chore: add self-play promotion gate"
```

### Task 6: Wire production strategy id into runtime

**Files:**
- Create: `src/lib/wolf-engine/strategy/runtime.ts`
- Modify: `src/lib/wolf-engine/aiClient.ts`
- Test: `src/lib/wolf-engine/aiClient.test.ts`

**Step 1: Write the failing test**

```ts
it('uses production strategy bundle prompts by strategy id', async () => {
  // expect prompt built from runtime-selected strategy
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/aiClient.test.ts`  
Expected: FAIL on missing runtime strategy hook

**Step 3: Write minimal implementation**

```ts
export function getProductionStrategyId(): string {
  return process.env.WOLF_STRATEGY_ID || 'strategy-baseline-v1';
}
```

**Step 4: Run focused tests**

Run: `cmd /c npm test -- src/lib/wolf-engine/aiClient.test.ts src/lib/wolf-engine/strategy/registry.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/strategy/runtime.ts src/lib/wolf-engine/aiClient.ts src/lib/wolf-engine/aiClient.test.ts
git commit -m "feat: wire runtime production strategy selection"
```

### Task 7: Final verification and docs

**Files:**
- Create: `docs/plans/2026-03-06-wolfgame-selfplay-release-checklist.md`
- Modify: `README.md`

**Step 1: Run full tests**

Run: `cmd /c npm test`  
Expected: all tests pass

**Step 2: Run release gate + self-play scripts**

Run:
- `cmd /c npm run check:wolf:release`
- `cmd /c npm run selfplay:eval`

Expected: both pass and generate eval report

**Step 3: Record evidence**

- Fill checklist with command outputs, metric deltas, promotion decision.

**Step 4: Commit docs**

```bash
git add docs/plans/2026-03-06-wolfgame-selfplay-release-checklist.md README.md
git commit -m "docs: add self-play strategy release checklist"
```

---

Plan complete and saved to `docs/plans/2026-03-06-wolfgame-selfplay-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?

