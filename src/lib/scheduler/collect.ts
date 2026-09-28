import { createHash } from "node:crypto";
import type { SourceAdapter } from "@/lib/adapters";
import { createAdapter } from "@/lib/ingest/adapters";
import { processRawItemsConfigured } from "@/lib/pipeline";
import { MemoryRawItemStore } from "@/lib/raw-items";
import type { RawItem } from "@/lib/raw-items";
import { runtimeStore, type CollectionRun, type JsonRuntimeStore, type RuntimeState } from "@/lib/runtime";
import { loadSourceRegistry, type SourceRecord } from "@/lib/sources";

const LIVE_SOURCE_IDS = ["cts", "astana-rek"] as const;
const PIPELINE_VERSION = 2;
let activeCollection: Promise<RuntimeState> | null = null;

function runId(startedAt: string): string {
  return `cr_${createHash("sha256").update(startedAt).digest("hex").slice(0, 16)}`;
}

export async function collectLiveSources(input: {
  adapters?: SourceAdapter[];
  registry?: SourceRecord[];
  store?: JsonRuntimeStore;
} = {}): Promise<RuntimeState> {
  if (activeCollection) return activeCollection;
  activeCollection = executeCollection(input).finally(() => {
    activeCollection = null;
  });
  return activeCollection;
}

async function executeCollection(input: {
  adapters?: SourceAdapter[];
  registry?: SourceRecord[];
  store?: JsonRuntimeStore;
}): Promise<RuntimeState> {
  const startedAt = new Date().toISOString();
  const registry = input.registry ?? loadSourceRegistry();
  const adapters = input.adapters ?? LIVE_SOURCE_IDS.map((sourceId) => createAdapter(sourceId));
  const store = input.store ?? runtimeStore;
  const previous = await store.read();
  const rawStore = new MemoryRawItemStore();
  previous.raw_items.forEach((item) => rawStore.insert(item));
  const sourceResults: CollectionRun["sources"] = [];
  const newRawItems: RawItem[] = [];

  for (const adapter of adapters) {
    try {
      const records = await adapter.discover();
      let created = 0;
      let duplicates = 0;
      for (const record of records) {
        const result = rawStore.insert(adapter.normalize(record));
        if (result.kind === "created") {
          created += 1;
          newRawItems.push(result.item);
        }
        else duplicates += 1;
      }
      sourceResults.push({ source_id: adapter.source_id, status: "ok", discovered: records.length, created, duplicates, error: null });
    } catch (error) {
      sourceResults.push({
        source_id: adapter.source_id,
        status: "failed",
        discovered: 0,
        created: 0,
        duplicates: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const rebuild = previous.pipeline_version < PIPELINE_VERSION;
  const pipeline = await processRawItemsConfigured(
    rebuild ? rawStore.list() : newRawItems,
    registry,
    "live",
    rebuild ? [] : previous.event_records,
  );
  const succeeded = sourceResults.filter((source) => source.status === "ok").length;
  const run: CollectionRun = {
    id: runId(startedAt),
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    status: succeeded === sourceResults.length ? "ok" : succeeded > 0 ? "partial" : "failed",
    sources: sourceResults,
  };
  const next: RuntimeState = {
    version: 1,
    pipeline_version: PIPELINE_VERSION,
    updated_at: run.finished_at,
    raw_items: rawStore.list(),
    event_records: pipeline.records,
    extraction_runs: (rebuild ? pipeline.extraction_runs : [...previous.extraction_runs, ...pipeline.extraction_runs]).slice(-500),
    collection_runs: [...previous.collection_runs, run].slice(-200),
  };
  await store.write(next);
  return next;
}
