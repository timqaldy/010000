# 010000.kz

This repository is the only project truth. Do not search outside it for another
spec. Use external research only when the active task requires current facts.
Load the smallest context needed for the next decision; expand only for a named
uncertainty.

### Session bootstrap

1. Read `PROJECT_STATE.md` + `TASK.md` fully.
2. If task is `idle` and the user did not say CONTINUE / request a batch: STOP.
3. Read `PRD.md` once per session; reopen only to resolve a concrete conflict.
4. Find `MASTER_PROMPT.md` headings first. Read only relevant sections plus
   §§5–9 before implementation and §55 before reporting; never all 62 sections.
5. Read only relevant `ARCHITECTURE.md` decisions; read it fully for structural
   or cross-cutting changes.
6. Read `SOURCE_POLICY.md` only for sources/ingestion/rights; read
   `EDITORIAL_POLICY.md` only for extraction/safety/scoring/publishing/UI.

### Code discovery

- Start with `TASK.md` paths, symbols, and acceptance criteria.
- Use `rg`/`rg --files`, then open focused ranges. Inspect the nearest code,
  direct types/dependencies, and tests; expand one dependency edge at a time.
- Exclude `node_modules`, `.next`, coverage, lockfile bodies, build artifacts,
  and `*.tsbuildinfo` unless targeted.
- Do not reopen unchanged files, repeat searches, or reconstruct history already
  summarized in `PROJECT_STATE.md`.
- Bound tool output: prefer filenames, headings, matches, and focused ranges.

### Scope and execution

- `TASK.md` is the only implementation scope. Code changes require Epic + Task
  IDs. Preserve user changes; do not absorb cleanup or the next task.
- CONTINUE / ПРОДОЛЖАЙ / NEXT means execute exactly one next unblocked task from
  `PROJECT_STATE.md`, then stop.
- Conflict priority: MASTER contract → PRD intent → architecture decisions →
  project state → task scope. Report conflicts; never silently reconcile them.

### Completion

Implementation: code → focused tests → full tests → typecheck → build → update
`PROJECT_STATE.md` → MASTER §55 report → STOP. Do not update project state for
analysis or context-rule-only documentation changes.
