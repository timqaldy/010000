# 010000.kz

Autonomous city intelligence for Astana. Public concept: **ASTANA / LIVE**.

The city reports itself. The central object is an **Event**, not a copied article.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm test
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

## Local preview

- `/` — chronological Event feed
- `/event/{id}` — facts, provenance, and revision history
- `/control` — pipeline metrics and truthful source readiness
- `/sources` — Source Registry
- `/api/events` and `/api/health` — read-only JSON

On `next start`, an isolated 30-minute scheduler immediately collects allowed
public HTML from CTS and Astana-REK, persists runtime state, and updates the feed.
Until the first successful cycle, the UI clearly shows a fixture fallback.

Copy `.env.example` to `.env.local` and set both `OPENAI_API_KEY` and
`OPENAI_MODEL` to enable OpenAI Structured Outputs. With either missing, the
system explicitly uses deterministic `rules-v1`; it never pretends rules are AI.
`.env.local` is ignored by Git; never commit or paste the real key into source,
logs, issues, or chat.

For a local autonomy sample against a non-default port, set the base URL before
running the check:

```powershell
$env:ACCEPTANCE_BASE_URL = "http://127.0.0.1:3100"
npm run acceptance:check
```

Use `ACCEPTANCE_EVIDENCE_PATH` to start a separate evidence file without
overwriting or mixing a previous acceptance run.

## Docs

| File | Role |
|---|---|
| `MASTER_PROMPT.md` | full development contract |
| `PRD.md` | product specification |
| `PROJECT_STATE.md` | operational memory |
| `TASK.md` | current small task |
| `ARCHITECTURE.md` | accepted technical decisions |
| `SOURCE_POLICY.md` | ingestion and reuse rules |
| `EDITORIAL_POLICY.md` | publication constitution |

## Current status

See `PROJECT_STATE.md`. Local production runs with persistent live collection for
2/5 P0 sources. Three gov.kz sources remain ticket-gated, OpenAI credentials are
not configured, and a fresh continuous 72-hour acceptance run remains required.
