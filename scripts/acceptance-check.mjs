import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const baseUrl = new URL(process.env.ACCEPTANCE_BASE_URL ?? "http://127.0.0.1:3000");
if (!["http:", "https:"].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
  throw new Error("ACCEPTANCE_BASE_URL must be an HTTP(S) URL without credentials");
}
const evidencePath = process.env.ACCEPTANCE_EVIDENCE_PATH
  ? path.resolve(root, process.env.ACCEPTANCE_EVIDENCE_PATH)
  : path.join(root, "data", "acceptance-run.json");
const now = new Date();

async function requestJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
}

async function readEvidence() {
  try {
    return JSON.parse(await readFile(evidencePath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return {
      version: 1,
      scope: "local-autonomy-72h",
      started_at: now.toISOString(),
      required_hours: 72,
      minimum_samples: 70,
      status: "running",
      samples: [],
    };
  }
}

const evidence = await readEvidence();
if (evidence.status !== "running") {
  console.log(JSON.stringify({
    status: evidence.status,
    elapsed_hours: Math.round(((Date.parse(evidence.finished_at ?? evidence.last_checked_at) - Date.parse(evidence.started_at)) / 3_600_000) * 10) / 10,
    samples: evidence.samples.length,
    evidence_path: evidencePath,
  }));
  process.exitCode = evidence.status === "passed_local" ? 0 : 1;
} else {
let sample;
try {
  const [health, eventsPayload] = await Promise.all([
    requestJson(new URL("/api/health", baseUrl)),
    requestJson(new URL("/api/events", baseUrl)),
  ]);
  const events = Array.isArray(eventsPayload.events) ? eventsPayload.events : [];
  const freshnessMinutes = (now.getTime() - Date.parse(health.updated_at)) / 60_000;
  const failures = [];
  if (health.mode !== "live") failures.push(`mode=${health.mode}`);
  if (health.last_collection?.status !== "ok") failures.push(`last_collection=${health.last_collection?.status ?? "missing"}`);
  if (!Number.isFinite(freshnessMinutes) || freshnessMinutes > 50) failures.push(`collection_age_minutes=${Math.round(freshnessMinutes)}`);
  if (events.length === 0) failures.push("no published events");
  if (events.some((event) => event.safety !== "PASS")) failures.push("published safety invariant failed");
  if (events.some((event) => event.confidence < 0.72)) failures.push("published confidence invariant failed");
  if (events.some((event) => event.importance < 0.55)) failures.push("published importance invariant failed");
  if (events.some((event) => event.source_count < 1 || !event.published_at)) failures.push("published attribution invariant failed");
  sample = {
    checked_at: now.toISOString(),
    ok: failures.length === 0,
    base_url: baseUrl.origin,
    mode: health.mode,
    live_sources: health.live_sources,
    raw_items: health.raw_items,
    events: health.events,
    published_events: events.length,
    collection_runs: health.collection_runs,
    collection_age_minutes: Math.round(freshnessMinutes * 10) / 10,
    failures,
  };
} catch (error) {
  sample = {
    checked_at: now.toISOString(),
    ok: false,
    base_url: baseUrl.origin,
    failures: [error instanceof Error ? error.message : String(error)],
  };
}

evidence.samples.push(sample);
const elapsedHours = (now.getTime() - Date.parse(evidence.started_at)) / 3_600_000;
if (elapsedHours >= evidence.required_hours) {
  const enoughSamples = evidence.samples.length >= evidence.minimum_samples;
  evidence.status = enoughSamples && evidence.samples.every((item) => item.ok) ? "passed_local" : "failed";
  evidence.finished_at = now.toISOString();
}
evidence.last_checked_at = now.toISOString();
await mkdir(path.dirname(evidencePath), { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ status: evidence.status, elapsed_hours: Math.round(elapsedHours * 10) / 10, samples: evidence.samples.length, evidence_path: evidencePath, sample }));
if (!sample.ok || evidence.status === "failed") process.exitCode = 1;
}
