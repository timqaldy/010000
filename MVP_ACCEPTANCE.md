# MVP ACCEPTANCE

Authoritative completion audit against `PRD.md` and `MASTER_PROMPT.md`.

**Audited:** 2026-09-28 19:36 Asia/Qyzylorda  
**Overall:** BLOCKED — local live MVP runs, but full PRD Definition of Done is not met.

| # | PRD requirement | Status | Evidence |
|---:|---|---|---|
| 1 | ≥5 approved Astana sources automatically monitored | BLOCKED | Registry has 5 enabled P0 records; `/api/health` proves only CTS and Astana-REK can collect live (`2/5`). Three gov.kz endpoints require a browser ticket; evasion is prohibited. |
| 2 | New source items become RawItems | PASS | First live cycle persisted 17 schema-valid RawItems in `data/runtime-state.json`. |
| 3 | Duplicate RawItems are not created | PASS | Subsequent cycle: 17 discovered, 0 created, 17 duplicates. Dedupe tests cover external ID → canonical URL → content hash. |
| 4 | AI generates structured Event data | BLOCKED | `src/lib/extraction/openai.ts` implements strict OpenAI Structured Outputs, but runtime evidence is 0 AI runs / 17 deterministic runs because `OPENAI_API_KEY` and `OPENAI_MODEL` are unset. |
| 5 | Multiple items can resolve to one Event | PASS | Resolver + pipeline test proves two independent items produce one Event with two EventSources. |
| 6 | Full source traceability | PASS | Every Event has validated EventSource records; `/event/{id}` exposes source name, URL, role, and observation time. |
| 7 | Confidence calculated | PASS | Evidence-weighted score uses unique independent sources and contradiction penalty; publication threshold is enforced. |
| 8 | Importance calculated | PASS | Category, location, actionability, and routine-content penalty are independent from confidence. |
| 9 | Unsafe/unsupported content blocked | PASS (automated) | Safety gate fails closed for ineligible sources, contradiction, PII, and sensational language; published records require `safety=PASS`. |
| 10 | Eligible Events auto-published | PASS | Pipeline assigns `published_at` only after confidence, importance, attribution, and safety gates. Current live API exposes 3 eligible Events from 17 candidates. |
| 11 | Public live feed updates without human editing | PASS | `next start` instrumentation runs collection immediately and every 30 minutes; `/` reads persistent live records dynamically. |
| 12 | Existing Events can update | PASS | Resolver merge changes lifecycle/source count/confidence and attaches new evidence. |
| 13 | Revision history preserved | PASS | Significant merges create validated immutable EventRevision snapshots shown on Event detail pages. |
| 14 | One source failure does not stop others | PASS | Isolation test proves one failed adapter plus one successful adapter yields a partial persisted run and published Event. |
| 15 | Autonomous operation ≥72 hours | FAILED | `data/acceptance-run.json` contains 4/70 required samples. Runtime history contains 84 collection runs, but its longest segment with gaps ≤50 minutes is 20 hours, so it does not prove 72 continuous hours. |
| 16 | No known unsupported published claim in acceptance run | PENDING | The 3 published cards preserve source attribution and all captured samples pass automated invariants, but no valid continuous 72-hour acceptance window exists yet. |

## Verification baseline

- `npm audit --audit-level=moderate`: 0 vulnerabilities.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass on Next.js 16.3.5.
- `npm test`: 61/61 passed in each of 10 consecutive final cycles on 2026-09-28.
- Local HTTP QA on `http://127.0.0.1:3100`: `/`, `/control`, `/sources`, Event
  detail and both JSON APIs return 200; health is live/degraded, with 17 RawItems,
  17 Event records, 3 published Events and latest collection ok.
- Published invariant audit: 0 violations across safety, confidence, importance,
  attribution and publication timestamp checks.

## Unblocking inputs

1. Provide `OPENAI_API_KEY` and an explicit `OPENAI_MODEL` for real AI runs.
2. Provide a lawful, documented feed/API/permission for the three gov.kz P0 sources,
   or approve a product decision replacing them with reviewed sources.
3. Start a fresh continuous 72-hour run with at least 70 samples. The acceptance
   script supports a non-default deployment through `ACCEPTANCE_BASE_URL` and a
   separate evidence file through `ACCEPTANCE_EVIDENCE_PATH`.
