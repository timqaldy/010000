# PRD — 010000.kz

Primary product specification. Read once per session. Daily work uses `PROJECT_STATE.md` + `TASK.md`.

If code conflicts with this file: identify, explain, propose the smallest change. Do not silently contradict.

## Problem

Astana residents need a trustworthy answer to “what is happening in the city right now?” Official facts are scattered. Copying articles, maps, and social posts without rights is not the product.

## Product

Autonomous city newsroom / city intelligence platform.

Public concept: **ASTANA / LIVE**. Core idea: **the city reports itself**.

Operating model: **zero human content operations**. Humans own governance, infrastructure, and legal responsibility. They do not approve every routine publication.

Central object: **Event**. Not an article, blog post, or source publication.

5 sources reporting one road closure → 1 Event + 5 EventSource records.

## User promise

Understand what is happening in Astana in about 30 seconds. Optimize for relevance, recency, trust, clarity, location, impact.

## MVP hypothesis

A fully automated system can discover important Astana events from approved sources, structure them, merge duplicates, score confidence and importance, and publish a useful live feed without a human editor.

Do not optimize for scale before this loop works.

## Pipeline

SOURCE → COLLECT → RAW ITEM → NORMALIZE → AI EXTRACTION → EVENT RESOLUTION → GEO → CONFIDENCE → IMPORTANCE → EDITORIAL → SAFETY → PUBLISH → LIVE FEED → UPDATE / ARCHIVE

## Source policy

See `SOURCE_POLICY.md`. Registry is mandatory. P0: Akimat, DChS, Transport, CTS, Astana-REK.

## Editorial / safety

See `EDITORIAL_POLICY.md`. Unsupported published claims = 0.

## Public MVP UI (not this stage)

Header `010000` / `ASTANA / LIVE`. Chronological Event cards. `/event/{id}` with timeline, sources, revisions.

## Not before their stage

Accounts, comments, push, native app, ads, subscriptions, citizen journalism, prediction, large RAG, social, video, AI avatar.

## Definition of done — MVP

1. At least 5 approved Astana sources automatically monitored.  
2. New source items become RawItems.  
3. Duplicate RawItems are not created.  
4. AI generates structured Event data.  
5. Multiple items can resolve to one Event.  
6. Full source traceability.  
7. Confidence calculated.  
8. Importance calculated.  
9. Unsafe / unsupported content blocked.  
10. Eligible Events auto-published.  
11. Public live feed updates without human editing.  
12. Existing Events can update.  
13. Revision history preserved.  
14. One source failure does not stop others.  
15. Autonomous operation ≥ 72 hours.  
16. No known unsupported factual claim published in the acceptance run.

## Current implementation vs PRD

Local vertical slice exists: Source Registry, RawItem/dedup, live CTS and
Astana-REK collection, persistent runtime state, Event resolution/scoring/safety,
public feed, provenance, revisions, and isolated scheduler. Gov.kz live sources
remain ticket-gated. OpenAI Structured Outputs is implemented but activates only
when credentials and an explicit model are configured; otherwise extraction is
clearly reported as deterministic rules. A 72-hour acceptance run is not complete.
