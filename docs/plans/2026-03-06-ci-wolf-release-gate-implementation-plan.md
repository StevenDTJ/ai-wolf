# Wolf Release CI Gate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a GitHub Actions CI workflow that blocks merges when wolf release gate checks fail.

**Architecture:** Create a single workflow file under `.github/workflows` and reuse existing npm scripts for lint, full tests, and wolf release gate checks. Keep implementation minimal and deterministic.

**Tech Stack:** GitHub Actions, Node.js 20, npm scripts, Vitest, ESLint.

---

### Task 1: Add CI workflow file

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Write workflow skeleton**
- Define workflow name, triggers (`push`, `pull_request`), and one job.

**Step 2: Add execution steps**
- Checkout code
- Setup Node 20
- `npm ci`
- `npm run lint`
- `npm test`
- `npm run check:wolf:release`

**Step 3: Validate YAML shape locally**
- Ensure file path and YAML syntax are valid.

**Step 4: Commit**
- `git add .github/workflows/ci.yml`
- `git commit -m "ci: add wolf release gate workflow"`

### Task 2: Verify local parity before handoff

**Files:**
- Modify: none (verification only)

**Step 1: Run lint**
- `cmd /c npm run lint`
- Expected: exit 0

**Step 2: Run tests**
- `cmd /c npm test`
- Expected: all tests pass

**Step 3: Run release gate**
- `cmd /c npm run check:wolf:release`
- Expected: pass all three gate stages

**Step 4: Summarize evidence**
- Record pass/fail and command outputs in handoff message.
