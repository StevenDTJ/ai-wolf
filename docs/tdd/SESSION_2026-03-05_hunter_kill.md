# TDD Session 记录

**日期**：2026-03-05
**功能/缺陷**：猎人被淘汰时选择击杀目标
**负责人**：AI (Claude)

## 需求摘要
- 猎人被投票淘汰或夜晚被击杀时，可以选择带走一名存活玩家
- 需要 AI 提示词让猎人选择击杀目标
- 需要游戏状态记录击杀目标并执行
- 需要集成到游戏流程中

## RED（失败测试）
### 第一轮：核心逻辑
- 新增测试文件：src/lib/wolf-engine/hunter.test.ts
- 运行命令：npm test -- src/lib/wolf-engine/hunter.test.ts
- 失败原因：hunter.ts 不存在，函数未定义

### 第二轮：集成逻辑
- 新增测试文件：src/lib/wolf-engine/hunterIntegration.test.ts
- 运行命令：npm test -- src/lib/wolf-engine/hunterIntegration.test.ts
- 失败原因：hunterIntegration.ts 不存在

### 第三轮：集成到 useWolfGame.ts
- 手动集成（React Hook 难以直接测试）

## GREEN（最小实现）
### 第一轮
- 修改文件：
  - src/lib/wolf-engine/types.ts（添加 hunterKillTargetId 字段）
  - src/lib/wolf-engine/hunter.ts（新增核心函数）
- 运行命令：npm test
- 通过结果：9 tests passed

### 第二轮
- 修改文件：
  - src/lib/wolf-engine/hunterIntegration.ts（新增）
- 运行命令：npm test
- 通过结果：12 tests passed

### 第三轮：集成到 useWolfGame.ts
- 修改文件：
  - src/hooks/useWolfGame.ts（导入并调用 handleHunterElimination）
  - src/lib/wolf-engine/gameLogic.ts（添加 hunterKillTargetId 字段）
  - src/lib/wolf-engine/gameLogic.test.ts（添加测试字段）
- 运行命令：npm test
- 通过结果：12 tests passed

## 导出函数清单
| 函数 | 用途 |
|------|------|
| `processHunterKill(state, targetId)` | 处理猎人击杀 |
| `getHunterKillTarget(state)` | 获取猎人击杀目标 |
| `getHunterKillPrompt(hunter, alivePlayers)` | 生成猎人击杀提示词 |
| `parseHunterKillTarget(response, alivePlayers)` | 解析 AI 响应 |
| `handleHunterElimination(state, aiCallFn?)` | 集成到游戏流程 |

## REFACTOR（可选）
- 无

## 备注
- 基于 TDD 开发框架
- 测试驱动开发，RED -> GREEN -> 验证全量通过
- 集成函数支持注入 AI mock（方便测试）
- 已完成：核心逻辑 + 集成到 useWolfGame
