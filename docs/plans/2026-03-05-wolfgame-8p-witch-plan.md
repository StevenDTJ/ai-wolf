# Wolfgame 8P + Witch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现 8 人局（2 狼 + 3 民 + 预言家 + 女巫 + 猎人）与女巫夜晚三选一规则，并确保流程与 UI 对应更新。

**Architecture:** 调整引擎角色池与夜晚流程（狼人→女巫→预言家），新增女巫状态字段与结算逻辑；UI 增加女巫行动界面与药品状态展示。

**Tech Stack:** Next.js, React, TypeScript.

---

> ⚠️ 约束：当前目录不是 git repo，无法提交 commit；计划中的“Commit”步骤只能在恢复 git 后执行。

### Task 1: 扩展角色类型与显示映射

**Files:**
- Modify: `src/types/index.ts` (或对应角色类型定义文件)
- Modify: `src/lib/wolf-engine/gameLogic.ts`

**Step 1: Write the failing test**

Run: `cmd /c npm run lint` (or unit tests if exist)
Expected: no direct test yet (new behavior). Create minimal unit test if test setup exists; otherwise proceed.

**Step 2: Write minimal implementation**

- 在 `WolfRole` / 角色映射中加入 `witch`。
- `ROLE_INFO` 加入女巫显示与阵营属性（好人）。

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`
Expected: no new errors.

**Step 4: Commit**

Skip (no git repo).

---

### Task 2: 8 人配置与角色分配

**Files:**
- Modify: `src/lib/wolf-engine/gameLogic.ts`

**Step 1: Write the failing test**

Add test (if test infra exists): `createWolfGame` for 8 players yields role counts: 2狼/3民/1预言家/1女巫/1猎人.

**Step 2: Write minimal implementation**

- 更新 `ROLES` 数组到 8 人配置。

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint` (and tests if available)
Expected: pass.

**Step 4: Commit**

Skip (no git repo).

---

### Task 3: 女巫状态字段与夜晚流程

**Files:**
- Modify: `src/lib/wolf-engine/types.ts`
- Modify: `src/lib/wolf-engine/gameLogic.ts`
- Modify: `src/hooks/useWolfGame.ts`

**Step 1: Write the failing test**

Add test: 夜晚流程中女巫选择 `save` 取消击杀；`poison` 额外击杀；`none` 仅狼人击杀。

**Step 2: Write minimal implementation**

- 在 `WolfGameState` 添加女巫字段：
  `witchSaveUsed`, `witchPoisonUsed`, `witchDecision`, `witchTargetId`.
- 增加女巫处理函数（消费药、生成消息、更新存活）。
- 调整夜晚结算：狼人杀人后，女巫依据三选一规则处理。

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint` (and tests if available)
Expected: pass.

**Step 4: Commit**

Skip (no git repo).

---

### Task 4: UI 增加女巫行动与状态提示

**Files:**
- Modify: `src/components/wolf-game.tsx`
- Modify: `src/components/wolf-player-card.tsx`

**Step 1: Write the failing test**

Manual verify (no UI tests): 女巫行动阶段显示被刀目标与三选一操作，药品用完禁用。

**Step 2: Write minimal implementation**

- 女巫行动区展示 “今晚被刀的是 X”。
- 三选一按钮：救 / 毒 / 不用；按钮状态依据药品是否已用。
- 女巫卡片显示药品使用情况。

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`
Expected: pass.

**Step 4: Commit**

Skip (no git repo).

---

### Task 5: 规则约束与兜底

**Files:**
- Modify: `src/lib/wolf-engine/gameLogic.ts`
- Modify: `src/hooks/useWolfGame.ts`

**Step 1: Write the failing test**

Add test: 同夜不能同时救毒；非法输入按 `none` 处理。

**Step 2: Write minimal implementation**

- UI 禁止非法组合。
- 引擎层对非法决策兜底为 `none`。

**Step 3: Run test to verify it passes**

Run: `cmd /c npm run lint`
Expected: pass.

**Step 4: Commit**

Skip (no git repo).

---

**Plan complete and saved to `docs/plans/2026-03-05-wolfgame-8p-witch-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
