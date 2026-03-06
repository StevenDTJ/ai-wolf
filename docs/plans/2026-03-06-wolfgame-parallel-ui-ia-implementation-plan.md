# Wolfgame Parallel Self-Play + UI IA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable parallel development by introducing a stable `UI Event v1` contract and deliver phase-clarity UI improvements (player view first, director view second) without blocking ongoing self-play strategy work.

**Architecture:** Keep engine/self-play and UI in separate tracks connected only through an adapter layer. Engine emits canonical UI events; UI consumes event stream to render a 4-zone flow-driven layout. Add director-view toggle on top of the same event source.

**Tech Stack:** TypeScript, Next.js/React, Vitest, existing `wolf-engine` modules, Tailwind/shadcn.

---

### Task 1: Define `UI Event v1` contract

**Files:**
- Create: `src/lib/wolf-engine/uiEvents.ts`
- Test: `src/lib/wolf-engine/uiEvents.test.ts`
- Modify: `src/lib/wolf-engine/index.ts`

**Step 1: Write the failing test**

```ts
it('exposes UiEventV1 with required fields', () => {
  const event = createUiEvent('phase_changed', { gameId: 'g1', round: 1, publicText: '进入白天' });
  expect(event.id).toBeTruthy();
  expect(event.type).toBe('phase_changed');
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/uiEvents.test.ts`  
Expected: FAIL (module missing)

**Step 3: Write minimal implementation**

```ts
export type UiEventType = 'phase_changed' | ...;
export interface UiEventV1 { ... }
export function createUiEvent(...) { ... }
```

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-engine/uiEvents.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/uiEvents.ts src/lib/wolf-engine/uiEvents.test.ts src/lib/wolf-engine/index.ts
git commit -m "feat: add UI Event v1 contract for wolf engine"
```

### Task 2: Build engine-to-UI event adapter

**Files:**
- Create: `src/lib/wolf-engine/uiEventAdapter.ts`
- Test: `src/lib/wolf-engine/uiEventAdapter.test.ts`

**Step 1: Write the failing test**

```ts
it('maps status transitions to phase_changed events', () => {
  const events = deriveUiEvents(prevState, nextState);
  expect(events.some(e => e.type === 'phase_changed')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/uiEventAdapter.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

```ts
export function deriveUiEvents(prev: WolfGameState, next: WolfGameState): UiEventV1[] {
  // detect phase, eliminations, vote resolution, etc.
}
```

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-engine/uiEventAdapter.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/uiEventAdapter.ts src/lib/wolf-engine/uiEventAdapter.test.ts
git commit -m "feat: add wolf state to UI event adapter"
```

### Task 3: Add event timeline storage in hook (non-breaking)

**Files:**
- Modify: `src/hooks/useWolfGame.ts`
- Test: `src/hooks/useWolfGame.test.ts`

**Step 1: Write the failing test**

```ts
it('appends phase_changed event when status changes', () => {
  // call helper with prev/next state and assert timeline append
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/hooks/useWolfGame.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Add `uiEvents: UiEventV1[]` to hook local state (not persisted to core engine state).
- Whenever `setSession(next)` occurs, derive and append events from `sessionRef.current -> next`.
- Keep existing game logic behavior unchanged.

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/hooks/useWolfGame.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useWolfGame.ts src/hooks/useWolfGame.test.ts
git commit -m "feat: track UI event timeline in useWolfGame hook"
```

### Task 4: Refactor wolf UI to 4-zone player view

**Files:**
- Create: `src/components/wolf-game/timeline-panel.tsx`
- Create: `src/components/wolf-game/stage-panel.tsx`
- Create: `src/components/wolf-game/action-panel.tsx`
- Create: `src/components/wolf-game/players-panel.tsx`
- Modify: `src/components/wolf-game.tsx`
- Modify: `src/app/globals.css`

**Step 1: Write/adjust lightweight UI helper tests**

Add pure helper tests for:
- phase label mapping
- event grouping/sorting
- panel visibility rules

Run in: `src/lib/wolf-game-ui.test.ts`

**Step 2: Run test to verify expected failures**

Run: `cmd /c npm test -- src/lib/wolf-game-ui.test.ts`  
Expected: FAIL for new helper expectations

**Step 3: Write minimal implementation**

- Split monolithic `wolf-game.tsx` into 4 focused panels.
- Keep existing controls and state source (`wolf` hook) unchanged.
- Player view renders `publicText` timeline only.

**Step 4: Run tests**

Run: `cmd /c npm test -- src/lib/wolf-game-ui.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/wolf-game.tsx src/components/wolf-game/*.tsx src/app/globals.css src/lib/wolf-game-ui.test.ts
git commit -m "refactor: deliver 4-zone flow-driven wolf UI player view"
```

### Task 5: Add director view toggle on same event stream

**Files:**
- Modify: `src/components/wolf-game.tsx`
- Create: `src/components/wolf-game/view-mode-toggle.tsx`
- Modify: `src/lib/wolf-game-ui.test.ts`

**Step 1: Write failing test**

```ts
it('director view can show directorText while player view cannot', () => {
  expect(renderText(event, 'player')).not.toContain('狼人目标');
  expect(renderText(event, 'director')).toContain('狼人目标');
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-game-ui.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Add `viewMode: 'player' | 'director'`.
- Timeline render logic:
  - player mode: only `publicText`
  - director mode: include `directorText` and key `meta`

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-game-ui.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/wolf-game.tsx src/components/wolf-game/view-mode-toggle.tsx src/lib/wolf-game-ui.test.ts
git commit -m "feat: add wolf UI director view mode"
```

### Task 6: Add mock event source for decoupled parallel dev

**Files:**
- Create: `src/lib/wolf-engine/uiEventMocks.ts`
- Modify: `src/components/wolf-game.tsx`
- Test: `src/lib/wolf-engine/uiEventMocks.test.ts`

**Step 1: Write failing test**

```ts
it('returns deterministic mock event timeline for a round', () => {
  const events = buildMockRoundEvents(1);
  expect(events[0].type).toBe('round_started');
});
```

**Step 2: Run test to verify it fails**

Run: `cmd /c npm test -- src/lib/wolf-engine/uiEventMocks.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Add deterministic mock generator with fixed timestamps.
- Add a local dev toggle in UI to switch `real events` / `mock events`.

**Step 4: Run test to verify it passes**

Run: `cmd /c npm test -- src/lib/wolf-engine/uiEventMocks.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/wolf-engine/uiEventMocks.ts src/lib/wolf-engine/uiEventMocks.test.ts src/components/wolf-game.tsx
git commit -m "chore: add mock UI event stream for parallel frontend work"
```

### Task 7: Verify non-regression and release gate

**Files:**
- Modify: `README.md` (UI event contract + view mode usage)
- Create: `docs/plans/2026-03-06-wolfgame-ui-ia-checklist.md`

**Step 1: Run focused tests**

Run:
- `cmd /c npm test -- src/lib/wolf-engine/uiEvents.test.ts src/lib/wolf-engine/uiEventAdapter.test.ts src/hooks/useWolfGame.test.ts src/lib/wolf-game-ui.test.ts`

Expected: PASS

**Step 2: Run full tests**

Run: `cmd /c npm test`  
Expected: PASS

**Step 3: Run release gate**

Run: `cmd /c npm run check:wolf:release`  
Expected: PASS

**Step 4: Document evidence and commit**

```bash
git add README.md docs/plans/2026-03-06-wolfgame-ui-ia-checklist.md
git commit -m "docs: add wolf UI IA parallel delivery checklist"
```

---

Plan complete and saved to `docs/plans/2026-03-06-wolfgame-parallel-ui-ia-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?

