# Wolfgame Context Matrix Implementation Plan (Main)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix context completeness and ordering, and correct hunter flow/broadcasts so each role sees exactly the right info at the right time.

**Architecture:** Extend game state to track wolf kill history and hunter kill phase; build a unified public timeline in `buildContext`; integrate that context into AI actions; insert hunter kill after witch/night and after vote/day with correct broadcasts.

**Tech Stack:** Next.js/React, TypeScript, Vitest.

---

### Task 1: Track wolf kill history + hunter kill phase

**Files:**
- Modify: `src/lib/wolf-engine/types.ts`
- Modify: `src/lib/wolf-engine/gameLogic.ts`
- Modify: `src/lib/wolf-engine/hunter.ts`
- Test: `src/lib/wolf-engine/hunterIntegration.test.ts`

**Step 1: Write the failing test**

```ts
it('records hunter kill phase when hunter shoots', async () => {
  const state = makeState('p8');
  const result = await handleHunterElimination(state, mockAICall);
  expect(result.hunterKillPhase).toBe('day');
  expect(result.hunterKillRound).toBe(1);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/wolf-engine/hunterIntegration.test.ts`
Expected: FAIL with "property hunterKillPhase undefined"

**Step 3: Write minimal implementation**
- Add `wolfKillHistory`, `hunterKillPhase`, `hunterKillRound` to `WolfGameState`.
- Initialize/reset fields in `createWolfGame` and `startNextRound`.
- Update `processWerewolfKill` to append to `wolfKillHistory`.
- Update `processHunterKill` to set `hunterKillPhase` and `hunterKillRound`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/wolf-engine/hunterIntegration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/types.ts src/lib/wolf-engine/gameLogic.ts src/lib/wolf-engine/hunter.ts src/lib/wolf-engine/hunterIntegration.test.ts
git commit -m "feat: track wolf kills and hunter kill phase"
```

---

### Task 2: Build public timeline without leaking private info

**Files:**
- Modify: `src/lib/wolf-engine/context.ts`
- Test: `src/lib/wolf-engine/buildContext.test.ts`

**Step 1: Write the failing test**

```ts
it('builds public timeline ordered across speeches/votes/broadcasts', () => {
  mockState.messages = [
    { id: 'b1', playerId: 'system', playerName: '系统', content: '播报', type: 'speech', round: 1, timestamp: 30 },
    { id: 's1', playerId: 'p1', playerName: 'A', content: '发言', type: 'speech', round: 1, timestamp: 10 },
  ];
  mockState.votes = [{ voterId: 'p2', voterName: 'B', targetId: 'p1', targetName: 'A', round: 1, timestamp: 20 }];
  const ctx = buildContext('villager', mockState, 'day_speech');
  expect(ctx.publicInfo.timeline.map(e => e.timestamp)).toEqual([10, 20, 30]);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/wolf-engine/buildContext.test.ts`
Expected: FAIL with "timeline is undefined"

**Step 3: Write minimal implementation**
- Add `publicInfo.timeline` to `PublicInfo`.
- Build timeline entries from `speeches`, `votes`, and **system broadcasts** (system `speech` only).
- Use `orderPublicInfo` to sort the merged list.
- Ensure `systemBroadcasts` excludes `inner_thought` (观众视角) messages.

**Step 4: Run tests**

Run: `npm test -- src/lib/wolf-engine/buildContext.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/context.ts src/lib/wolf-engine/buildContext.test.ts
git commit -m "feat: add ordered public timeline"
```

---

### Task 3: Integrate unified context into AI actions

**Files:**
- Modify: `src/hooks/useWolfGame.ts`
- Modify: `src/lib/wolf-engine/types.ts`
- Modify: `src/lib/wolf-engine/aiClient.ts`

**Step 1: Write the failing test**

```ts
it('exposes publicInfo and privateInfo on day/night contexts', () => {
  const ctx = buildContext('seer', mockState, 'night_seer');
  expect(ctx.publicInfo.timeline.length).toBeGreaterThanOrEqual(0);
  expect(ctx.privateInfo.seerChecks).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/wolf-engine/buildContext.test.ts`
Expected: FAIL (if fields missing)

**Step 3: Write minimal implementation**
- Update `buildNightContext`/`buildDayContext` to call `buildContext(role, state, phase)` and include `publicInfo`/`privateInfo`.
- Update AI generators to accept the enriched context (keep existing fields for prompts).

**Step 4: Run tests**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useWolfGame.ts src/lib/wolf-engine/types.ts src/lib/wolf-engine/aiClient.ts
git commit -m "feat: pass unified context to AI actions"
```

---

### Task 4: Fix hunter flow order + broadcasts

**Files:**
- Modify: `src/hooks/useWolfGame.ts`
- Modify: `src/lib/wolf-engine/hunterFlow.ts`
- Modify: `src/lib/wolf-engine/broadcasts.ts`
- Test: `src/lib/wolf-engine/hunterFlow.test.ts`
- Test: `src/lib/wolf-engine/broadcasts.test.ts`

**Step 1: Write failing tests**

```ts
it('includes night hunter kill in death broadcast only for night phase', () => {
  const msg = buildNightBroadcast({ ...mockState, hunterKillPhase: 'night', hunterKillTargetId: 'player-2' } as any);
  expect(msg.content).toContain('玩家2');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/wolf-engine/broadcasts.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**
- After witch resolution, run `applyHunterAfterWitch` and then add night broadcast before day.
- For day voting, run hunter kill **before** final speech and use `buildDayVoteBroadcast` for system message.
- In `buildNightBroadcast`, include hunter kill **only when** `hunterKillPhase === 'night'` and `hunterKillRound === currentRound`.

**Step 4: Run tests**

Run: `npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useWolfGame.ts src/lib/wolf-engine/hunterFlow.ts src/lib/wolf-engine/broadcasts.ts src/lib/wolf-engine/hunterFlow.test.ts src/lib/wolf-engine/broadcasts.test.ts
git commit -m "feat: correct hunter flow and broadcasts"
```

---

## Execution Handoff
Plan complete and saved to `docs/plans/2026-03-05-wolfgame-context-matrix-main.md`.

Two execution options:

1. Subagent-Driven (this session)
2. Parallel Session (separate)

Which approach?
