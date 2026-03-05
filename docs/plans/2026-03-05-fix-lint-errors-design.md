# 2026-03-05 修复 8 个 ESLint error 设计

## 目标
- 仅修复当前 `npm run lint` 报出的 8 个 error。
- 不扩展范围，不清理 warning，不改变业务流程与 UI。

## 范围与约束
- 只改动触发 error 的具体代码行与必要的最小上下文。
- 不调整 ESLint 规则。
- 验证方式仅为 `cmd /c npm run lint`，确保 error 清零，warning 保留。
- 当前目录非 git repo，无法 commit；仅写入设计文档与代码改动。

## 修复策略（最小改动）
1) **渲染期副作用**  
   - `page.tsx` 中 `Date.now()` 在 render 期调用，改为稳定值：
     - 优先在事件/数据生成处赋值；
     - 若必须在 render 产生，使用 `useMemo`/state 初始化，确保渲染幂等。

2) **useEffect 内同步 setState**  
   - `debater-form.tsx` 与 `wolf-game.tsx` 中 effect 直接 `setState`：
     - 增加条件判断避免每次 render 触发；
     - 或改为从派生值直接计算（`useMemo`）/初始化逻辑移出 effect。

3) **prefer-const**  
   - `useWolfGame.ts` 两处变量仅赋值一次，改为 `const`。

4) **no-explicit-any**  
   - `aiClient.ts` 两处 `any` 改为明确类型；
   - 若类型不可确定，使用 `unknown` 并缩小使用范围。

## 涉及文件（预期）
- `src/app/page.tsx`
- `src/components/debater-form.tsx`
- `src/components/wolf-game.tsx`
- `src/hooks/useWolfGame.ts`
- `src/lib/wolf-engine/aiClient.ts`
- `src/lib/wolf-engine/gameLogic.ts`

## 验证
- 运行 `cmd /c npm run lint`，确认 8 个 error 归零。

## 风险与回滚
- 改动仅限静态规则错误，风险低；
- 若出现行为偏差，回滚对应最小改动文件即可恢复。
