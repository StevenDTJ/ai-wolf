# Fix ESLint Errors Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 清除当前 8 个 ESLint error，不扩大范围、不处理 warning。

**Architecture:** 以最小改动修复渲染期不纯函数、effect 中 setState、类型 any、以及 prefer-const 规则问题。必要时调整函数签名以消除 `any`，不改变业务流程。

**Tech Stack:** Next.js (App Router), React, TypeScript, ESLint.

---

> ⚠️ 约束：当前目录不是 git repo，无法提交 commit；计划中的“Commit”步骤只能在恢复 git 后执行。

### Task 1: 移除 render 期的 `Date.now()`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Write the failing test**

Run: `cmd /c npm run lint`

Expected: `src/app/page.tsx` 报错 `react-hooks/purity`（Date.now in render）。

**Step 2: Write minimal implementation**

将 streaming message 的 `timestamp` 改为稳定值（不在 render 中调用 `Date.now()`）。

```tsx
// before
 timestamp: Date.now(),

// after (稳定值)
 timestamp: session.messages.length > 0
   ? session.messages[session.messages.length - 1].timestamp
   : 0,
```

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`

Expected: `page.tsx` 的 `Date.now` error 消失，其它 error 仍可能存在。

**Step 4: Commit**

Skip (no git repo).

---

### Task 2: 移除 `debater-form` 中 effect 内同步 `setState`

**Files:**
- Modify: `src/components/debater-form.tsx`

**Step 1: Write the failing test**

Run: `cmd /c npm run lint`

Expected: `debater-form.tsx` 报错 `react-hooks/set-state-in-effect`。

**Step 2: Write minimal implementation**

删除 `useEffect`，改为在模型变更事件里同步更新 `baseUrl`（仅在当前 `baseUrl` 为默认值时更新）。

```tsx
// add handler
const handleModelChange = (nextModel: string) => {
  setModel(nextModel);
  const defaultUrl = MODEL_BASE_URLS[nextModel] || 'https://api.openai.com/v1';
  const isDefaultUrl =
    !baseUrl ||
    Object.values(MODEL_BASE_URLS).includes(baseUrl) ||
    baseUrl === 'https://api.openai.com/v1';
  if (isDefaultUrl) {
    setBaseUrl(defaultUrl);
  }
};

// use handler in input & quick buttons
<Input value={model} onChange={(e) => handleModelChange(e.target.value)} />
// buttons: onClick={() => handleModelChange(m)}
```

并移除 `useEffect` import 和原 effect 块。

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`

Expected: `debater-form.tsx` 的 `set-state-in-effect` error 消失。

**Step 4: Commit**

Skip (no git repo).

---

### Task 3: 移除 `wolf-game` 中 effect 内同步 `setState`

**Files:**
- Modify: `src/components/wolf-game.tsx`

**Step 1: Write the failing test**

Run: `cmd /c npm run lint`

Expected: `wolf-game.tsx` 报错 `react-hooks/set-state-in-effect`。

**Step 2: Write minimal implementation**

将预设加载改为 `useState` 懒初始化，删除加载用 `useEffect`。

```tsx
const [presets, setPresets] = useState<WolfPlayerPreset[]>(() => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('wolfPlayerPresets');
  if (!saved) return [];
  try {
    return JSON.parse(saved) as WolfPlayerPreset[];
  } catch (e) {
    console.error('Failed to load presets:', e);
    return [];
  }
});

// remove the useEffect that calls setPresets
```

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`

Expected: `wolf-game.tsx` 的 `set-state-in-effect` error 消失。

**Step 4: Commit**

Skip (no git repo).

---

### Task 4: 修复 `useWolfGame` 中 `prefer-const`

**Files:**
- Modify: `src/hooks/useWolfGame.ts`

**Step 1: Write the failing test**

Run: `cmd /c npm run lint`

Expected: `prefer-const` error for `chatMessages` & `allKillVotes`。

**Step 2: Write minimal implementation**

```ts
const chatMessages: WolfMessage[] = [];
const allKillVotes: Array<{ playerId: string; targetId: string | null }> = [];
```

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`

Expected: `prefer-const` errors 消失。

**Step 4: Commit**

Skip (no git repo).

---

### Task 5: 修复 `aiClient` 中 `no-explicit-any`

**Files:**
- Modify: `src/lib/wolf-engine/gameLogic.ts`
- Modify: `src/lib/wolf-engine/aiClient.ts`

**Step 1: Write the failing test**

Run: `cmd /c npm run lint`

Expected: `aiClient.ts` 两处 `no-explicit-any` error。

**Step 2: Write minimal implementation**

将 `getAliveRoleTypes` 改为接受 `WolfPlayer[]`，避免构造假 `WolfGameState`。

```ts
// gameLogic.ts
export function getAliveRoleTypes(players: WolfPlayer[]): string {
  const uniqueRoles = [...new Set(players.map(p => p.role))];
  return uniqueRoles.map(r => ROLE_INFO[r]?.label || r).join('、');
}
```

```ts
// aiClient.ts
aliveRoleTypes: getAliveRoleTypes(context.alivePlayers),
```

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`

Expected: `aiClient.ts` 的 `no-explicit-any` errors 消失。

**Step 4: Commit**

Skip (no git repo).

---

### Task 6: 修复 `gameLogic` 中 `prefer-const`

**Files:**
- Modify: `src/lib/wolf-engine/gameLogic.ts`

**Step 1: Write the failing test**

Run: `cmd /c npm run lint`

Expected: `gameLogic.ts` 报 `prefer-const` for `finalKilledId`。

**Step 2: Write minimal implementation**

```ts
const finalKilledId = killedId;
```

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`

Expected: `gameLogic.ts` 的 `prefer-const` error 消失（可能仍有未使用 warning）。

**Step 4: Commit**

Skip (no git repo).

---

**Plan complete and saved to `docs/plans/2026-03-05-fix-lint-errors-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
