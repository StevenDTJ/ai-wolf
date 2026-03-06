# Wolfgame Self-Play Release Checklist (2026-03-06)

## 1) Full test suite

- Command: `npm test`
- Result: PASS
- Evidence:
  - `Test Files 19 passed (19)`
  - `Tests 56 passed (56)`

## 2) Release gate

- Command: `npm run check:wolf:release`
- Result: PASS
- Evidence:
  - `invariants + rule tests`: PASS
  - `golden replay tests`: PASS
  - `20-game simulation tests`: PASS
  - final line: `[wolf-release] PASS: all release gate checks passed.`

## 3) Self-play evaluation

- Command: `npm run selfplay:eval`
- Result: PASS
- Report: `reports/selfplay-eval-report.json`
- Key metrics:
  - baseline strategy id: `strategy-baseline-v1`
  - winRate: `1.00`
  - keyDecision: `0.60`
  - robustness: `1.00`
  - violations: `0`
  - score: `0.88`

## 4) Promotion decision

- Command: `npm run selfplay:promote`
- Result: completed, promotion rejected (as expected with zero uplift)
- Decision file: `reports/selfplay-promotion-decision.json`
- Decision details:
  - baselineScore: `0.88`
  - candidateScore: `0.88`
  - uplift: `0.0000`
  - gatePassed: `true`
  - promoted: `false`

## 5) Notes

- Runtime production strategy id is controlled by `WOLF_STRATEGY_ID` with default `strategy-baseline-v1`.
- Promotion threshold requires uplift `>= 5%` and release gate pass.
