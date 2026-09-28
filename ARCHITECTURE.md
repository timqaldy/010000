# ARCHITECTURE

Принятые решения. Читать точечно.

## Стек

- Next.js 16 App Router, React 19, TypeScript strict
- Zod — схемы Source, RawItem, Event, EventSource, EventRevision и extraction candidate
- Vitest 4 + HTML/JSON fixtures; ESLint flat config
- Persistence: `data/sources.json` + локальный валидируемый
  `data/runtime-state.json` для RawItem, Event, extraction/collection runs.
  `MemoryRawItemStore` остаётся unit-of-work для одного collection cycle.

## Карта кода

| Путь | Зачем |
|---|---|
| `data/sources.json` | Source Registry |
| `src/lib/sources/*` | реестр, reuse-инварианты |
| `src/lib/raw-items/*` | RawItem, hash, dedupe, store |
| `src/lib/adapters/*` | контракт адаптера + registry gate |
| `src/lib/adapters/gov-kz/*` | Akimat: parse/normalize наблюдаемого JSON, live fetch blocked |
| `src/lib/adapters/cts/*` | CTS: parse/normalize HTML-листинга |
| `src/lib/adapters/astana-rek/*` | REK: news listing + один outage bulletin |
| `src/lib/ingest/*` | ручной ingest: payload → RawItem store |
| `src/lib/events/*` | Event / EventSource / EventRevision + lifecycle |
| `src/lib/extraction/*` | rules-v1 + optional OpenAI Structured Outputs + telemetry |
| `src/lib/resolver/*` | deterministic filters + token similarity |
| `src/lib/scoring/*` | независимые confidence и importance |
| `src/lib/safety/*` | fail-closed editorial safety gate |
| `src/lib/publication/*` | threshold-based publish eligibility |
| `src/lib/pipeline/*` | RawItem → Event vertical slice |
| `src/lib/runtime/*` | schema-validated persistent local state |
| `src/lib/scheduler/*` | isolated live collection + 30-minute local scheduler |
| `src/instrumentation.ts` | immediate collection on production server start |
| `src/app/page.tsx` | dynamic live Event feed with fixture fallback |
| `src/app/event/[id]` | событие, provenance, revisions |
| `src/app/control/page.tsx` | честное состояние pipeline и P0 adapters |
| `src/app/sources/page.tsx` | внутренний реестр источников |
| `tests/fixtures/**` | CI без live-сайтов |

## Решения

- Центральный объект продукта — Event. Модель, lifecycle, evidence, revisions,
  resolver, scoring, safety и publication gate реализованы.
- Без `OPENAI_API_KEY` + `OPENAI_MODEL` extraction использует явно маркированный
  deterministic `rules-v1`. С обоими значениями включается OpenAI Responses API
  Structured Outputs; schema/refusal/error fail closed, usage сохраняется.
- `FACTS_ONLY`: храним title/summary/url/date, не полный HTML и не картинки.
- Dedup до AI: `external_id` → canonical URL → `content_hash`. Один source_id. Чужой источник с тем же текстом — новая улика.
- gov.kz: SPA + ticket-gated `/api/v1/public/content-manager/news`. Ticket не обходим. Адаптер работает на fixture/ручном payload.
- CTS: live public HTML `/ru/press-center/news/`. `robots.txt` = 404. Дата в
  листинге без года → `published_at = null`; год не угадывается.
- Astana-REK: live public HTML `/news` с атрибутом `datetime`. Страница
  отключений — один бюллетень; список адресов не хранится. `robots.txt` = 404.
- Один упавший адаптер не должен ронять другие: live fetch бросает локальную ошибку адаптера.
- `next.config.ts`: `outputFileTracingRoot` = корень репо.
- Next.js обновлён с 15 до 16.3.5 из-за high-severity advisory во вложенном
  PostCSS; после миграции `npm audit` = 0.
- Scheduler обрабатывает только новые RawItems: повторные циклы не вызывают AI и
  не создают Events/Revisions повторно.
- Retryable HTTP failures (`429`/`5xx`/network) имеют два bounded retry с
  экспоненциальной задержкой; прочие `4xx` и неверный content type fail fast.
- `pipeline_version` запускает однократную переработку сохранённых RawItems после
  семантических изменений без ручного удаления runtime data.
- Явные формулировки «восстановлено/завершено/устранено» переводят Event в
  `RESOLVED`; неизвестное состояние не угадывается.
- Публичная лента показывает `live` только после сохранённого успешного сбора;
  до него используется явно маркированный fixture fallback.

## Документы

`MASTER_PROMPT.md`, `PRD.md`, `SOURCE_POLICY.md`, `EDITORIAL_POLICY.md`, `PROJECT_STATE.md`, `TASK.md`.
