# PROJECT_STATE

**Updated:** 2026-09-28

## Current stage

STAGE 6 — AUTONOMOUS (локальный runtime; production acceptance частично)

## Current epic

MVP-LOCAL-03 — retryable collection and versioned lifecycle semantics

## Current task

`[E25-T03] 72-hour autonomous acceptance` — blocked pending external inputs

## Last completed task

`[MVP-LOCAL-03] Bounded retries + RESOLVED lifecycle + pipeline-v2 migration`

## Next proposed task

Resume `[E25-T03]` with a fresh evidence file after OpenAI credentials are
configured. In parallel, obtain a lawful feed/API/permission for the three
gov.kz P0 sources without ticket evasion.

## Known blockers

- gov.kz P0 (Akimat, DChS, Transport): JS shell + ticket-gated API. Обход запрещён.
- AI credentials/model не предоставлены. OpenAI Structured Outputs реализован,
  но runtime честно использует `rules-v1` до появления обоих env values.
- Production-хост/домен не предоставлен; доступен persistent local deployment.
- Первый 72-часовой прогон завершён как failed: 4/70 требуемых samples за 90.5
  часов. Все четыре samples были валидны, но непрерывность не доказана.
- В runtime накоплено 84 collection runs, но самый длинный сегмент с интервалом
  не более 50 минут — 20 часов; разрывы нельзя считать 72-часовой автономностью.

## Known technical debt

- Persistence — локальный JSON, не production database
- Нет CLI для ingest
- Scheduler живёт внутри `next start`; нет distributed lock
- Geo пока только текстовый label/district, без координат
- Gov.kz `discover()`/`fetch()` остаются fail-closed

## Known source issues

- `qazaqjylu.kz` слабо подтверждён
- Аэропорт: `nn-airport.kz`
- CTS дата без года
- gov.kz `robots_status=restricted`
- astrec.kz `robots.txt` = 404

## Known legal/compliance issues

- Нет лицензии на fulltext/images
- Telegram / Yandex Maps / 2GIS — PROHIBITED
- REK outage: в RawItem только lead, не список улиц

## Current test status

61 passed × 10 consecutive final cycles (2026-09-28)

## Current build status

`npm run lint` pass. `npm run typecheck` pass. `npm test` 61 passed in each
of 10 consecutive final cycles. `npm run build` pass on Next.js 16.3.5.
`npm audit`: 0 vulnerabilities. Live acceptance: CTS 12 + Astana-REK 5 RawItems;
latest cycle 17/17 duplicates, 0 new. HTTP QA: `/`, `/control`, `/sources`,
Event detail, health and Event API all return 200; 0 published invariant failures.

## Current deployed version

Local production: `http://127.0.0.1:3100` (Next.js 16.3.5, persistent live mode,
2/5 sources collecting; fixture fallback only before the first successful run).
Port 3000 belongs to an unrelated local application and was not disturbed.

## Acceptance run

The run started 2026-09-13 00:37 (Asia/Qyzylorda) and finalized failed on
2026-09-16 after 90.5 hours because only 4/70 samples were captured. Evidence:
`data/acceptance-run.json`. Each captured sample passed local invariants, but the
gap cannot be backfilled. Runtime collection history through 2026-09-28 contains
84 runs, but no continuous segment longer than 20 hours. Start a new continuous
run only after OpenAI credentials are configured; `scripts/acceptance-check.mjs` supports
`ACCEPTANCE_BASE_URL` and `ACCEPTANCE_EVIDENCE_PATH`.
