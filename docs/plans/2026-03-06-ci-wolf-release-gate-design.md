# Wolf Release CI Gate Design

Date: 2026-03-06

## Goal

在 GitHub Actions 中把 Wolf 8P 稳定性门禁固化为 PR/Push 必跑检查，避免本地通过但远端回归。

## Scope

- 新增一个 CI workflow。
- Node 环境安装依赖后，按顺序执行：`npm run lint`、`npm test`、`npm run check:wolf:release`。
- 触发事件：`pull_request` 与 `push`（默认分支）。

## Approach Options

1. 单独 `wolf-release.yml`：仅跑 `check:wolf:release`，快但覆盖面窄。
2. 通用 `ci.yml`（推荐）：lint + full test + wolf release gate，覆盖完整交付风险。
3. 拆分多 job：并行更快，但复杂度更高，当前阶段不必要。

推荐方案：2。当前项目已有脚本，直接复用最稳妥。

## Risks and Mitigations

- 风险：lint 历史 warning 过多。  
  缓解：仅对 `error` 失败；warning 暂不阻塞。
- 风险：重复跑测试导致时长上升。  
  缓解：先采用清晰串行，后续若耗时过高再拆 job 优化。

## Success Criteria

- PR 提交后自动触发 CI。
- 任一步失败时 workflow 失败。
- `check:wolf:release` 在 CI 中稳定通过。
