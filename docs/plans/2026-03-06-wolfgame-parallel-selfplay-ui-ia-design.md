# 狼人杀并行开发方向设计（自博弈策略 + 信息架构优化）

**日期**: 2026-03-06  
**范围**: 8人标准局  
**前提**: 自博弈策略迭代已在开发中  
**产品目标**: 强化“观看 AI 博弈戏剧性”（智斗与下饭操作）

---

## 1. 核心结论

- 两项开发可以并行开展，且建议并行。
- 前端方向采用：**目标选方向3（双视角布局），一期落地方向1（流程驱动布局）**。
- 并行关键在于：冻结一层稳定的 `UI Event v1` 契约，前端只消费契约，不依赖策略内部实现。

---

## 2. 并行可行性评估

### 2.1 代码边界

- **策略自博弈轨道**（A）：`src/lib/wolf-engine/*`、`scripts/*`
- **图形化/UI轨道**（B）：`src/components/wolf-game.tsx`、`src/app/page.tsx`、`src/app/globals.css`

当前结构天然可拆分，冲突点集中在“引擎输出给UI的信息格式”。

### 2.2 风险点

1. 策略轨道字段频繁变化，导致 UI 接口抖动。
2. UI 为了展示细节直接读取引擎内部状态，形成强耦合。
3. 两轨道各自加字段，缺少版本管理后出现不可预期冲突。

### 2.3 结论

- 并行可行；但必须先定义共享契约并设版本规则。

---

## 3. 并行协作方案（契约解耦）

### 3.1 组织方式

- A轨道继续当前自博弈开发，不暂停。
- B轨道先用 mock 事件流完成界面信息架构重排。
- 每周一次契约变更窗口，其余时间禁止破坏性改动。

### 3.2 契约规则

- 契约版本固定为 `v1`。
- 新信息优先扩展到 `meta`，不改主字段语义。
- 破坏性变更必须升 `v2`，并提供迁移适配层。

---

## 4. UI Event v1 最小契约

```ts
type UiEventType =
  | 'phase_changed'
  | 'wolf_chat'
  | 'night_kill_locked'
  | 'witch_decision'
  | 'seer_check'
  | 'day_speech'
  | 'vote_cast'
  | 'vote_resolved'
  | 'player_eliminated'
  | 'round_started'
  | 'game_ended';

interface UiEventV1 {
  id: string;
  gameId: string;
  round: number;
  ts: number;
  type: UiEventType;
  actorId?: string;
  targets?: string[];
  publicText: string;
  directorText?: string;
  meta?: Record<string, unknown>;
}
```

### 4.1 展示规则

- 玩家视角：只使用 `publicText`（禁止泄露私密身份信息）。
- 导演视角：可使用 `publicText + directorText + meta` 展示完整因果链。

---

## 5. 状态机到事件映射（v1）

1. `round_started`：`startNextRound` 后触发。  
2. `phase_changed`：每次 `status` 迁移触发。  
3. `wolf_chat`：每条狼人密聊写入时触发。  
4. `night_kill_locked`：`processWerewolfKill` 后触发。  
5. `witch_decision`：`processWitchDecision` 后触发。  
6. `seer_check`：`processSeerCheck` 后触发。  
7. `day_speech`：白天发言消息写入时触发。  
8. `vote_cast`：每位玩家投票产生时触发。  
9. `vote_resolved`：`processVotingResults` 后触发。  
10. `player_eliminated`：`eliminatePlayer` 后触发。  
11. `game_ended`：`checkWinCondition` 命中后触发。

---

## 6. 前端信息架构方向（目标3 / 一期1）

## 6.1 长期目标：双视角布局（方向3）

- **玩家视角**：强调剧情与戏剧冲突，弱化技术细节。
- **导演视角**：显示完整事件链、决策原因、关键分歧点。

## 6.2 一期落地：流程驱动布局（方向1）

页面拆分为四区：

1. **阶段导航区**：当前轮次、当前阶段、下一阶段按钮。  
2. **当前行动卡**：本阶段核心动作（谁在行动、行动状态、是否已锁定）。  
3. **时间线区**：按事件流滚动展示，支持过滤（公开/导演）。  
4. **玩家态势板**：存活状态、发言顺序、投票态势摘要。

---

## 7. 交付优先级建议

### P0（必须先做）

- 固定 `UI Event v1` 契约。
- 新增契约适配层（引擎输出 -> UI事件流）。
- 前端基于 mock + v1 先完成流程驱动布局。

### P1（并行推进）

- 接入真实事件流，完成玩家视角稳定展示。
- 导演视角第一版（显示 `directorText` 与核心 `meta`）。

### P2（后续）

- 事件筛选、戏剧性高光聚合、回放跳转。

---

## 8. 验收标准

1. 两轨道可独立开发与合并，无高频冲突。
2. 前端无需依赖策略内部字段即可稳定渲染流程。
3. 玩家视角可连续观看完整对局剧情；导演视角可追踪关键决策因果。
4. 不破坏现有 `check:wolf:release` 稳定性门禁。

