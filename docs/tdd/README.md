# TDD 开发框架（给能力较弱的 AI 用）

## 目标
让开发流程可预测、可验证、低风险。任何功能修改都必须先有失败测试，再写最小实现。

## 三条铁律
1. **先测后改**：没有失败测试，不改生产代码。
2. **一次只改一件事**：每个测试只覆盖一个行为。
3. **验证闭环**：红 -> 绿 -> 重构，每一步都要跑测试。

## 快速开始
1. 复制 `docs/tdd/SESSION_TEMPLATE.md` 新建一份 session 记录
2. 用 `docs/tdd/AI_PROMPT.md` 作为 AI 提示词
3. 写测试（放到 `src/**/` 中，命名 `*.test.ts`）
4. `npm test -- path/to/your.test.ts` 看红
5. 最小实现 → 再跑测试看绿

## 命令
- 跑单测：`npm test -- path/to/your.test.ts`
- 监视模式：`npm run test:watch`
- 全量测试：`npm test`

## 产物规范
每次功能变更至少包含：
- 1 个失败测试（红）
- 最小实现（绿）
- 必要重构（可选）
- 记录：`docs/tdd/SESSION_TEMPLATE.md` 的更新