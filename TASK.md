# TASK

**Status:** blocked  
**Batch:** E25-T03 — 72-hour autonomous acceptance

## Active task

- **E25-T03** — run a continuous local production deployment for at least 72
  hours, collect at least 70 valid samples, prove zero unsupported published
  claims, and close the remaining acceptance evidence.

## Tasks

- **E06-T01** — Event, EventSource, EventRevision models and lifecycle
- **E07-T01** — structured extraction boundary and observability
- **E09-T01** — deterministic Event resolver
- **E11-T01** — evidence-based confidence
- **E12-T01** — independent importance score
- **E13-T01** — editorial safety gate
- **E14-T01** — auto-publish eligibility
- **E15-T01** — chronological public live feed
- **E16-T01** — Event detail, provenance, and revisions
- **E19-T01** — isolated scheduler/health control plane
- **E25-T01** — local production deployment and repeated verification
- **E03-T04** — permitted live CTS/Astana-REK collectors
- **E07-T02** — optional OpenAI Structured Outputs provider
- **E19-T02** — isolated 30-minute scheduler and collection logs
- **E25-T02** — persistent schema-validated local runtime
- **E03-T05** — bounded live HTTP retry/backoff
- **E06-T02** — evidence-derived RESOLVED lifecycle
- **E19-T03** — versioned pipeline migration without repeat processing

## Acceptance

Build a truthful local MVP over fixture-backed evidence, clearly label demo data,
keep blocked live sources blocked, expose health/limitations, pass tests,
typecheck, production build, and ten repeated verification cycles. Start a local
production server and provide its URL.

## Result

Persistent live collection, scheduler, runtime store, editorial filtering,
OpenAI Structured Outputs, bounded retries, lifecycle semantics, and safe
pipeline migration completed. Full PRD acceptance remains blocked by credentials,
gov.kz access constraints, and the 72-hour run recorded in `PROJECT_STATE.md`.

The original 2026-09-13 acceptance run did not collect continuous evidence and
cannot be counted as passed. A new run must start after OpenAI credentials are
configured. Port 3000 is occupied by another local application, so the verified
010000.kz deployment uses `http://127.0.0.1:3100`.

Reverified on 2026-09-28: lint, typecheck, production build and audit pass;
61/61 tests pass in 10 consecutive cycles; all public and control routes return
HTTP 200. Runtime history still has no continuous segment longer than 20 hours.
