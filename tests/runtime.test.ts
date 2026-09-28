import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CtsAdapter, type SourceAdapter } from "@/lib/adapters";
import { JsonRuntimeStore, createEmptyRuntimeState, runtimeStateSchema } from "@/lib/runtime";
import { collectLiveSources } from "@/lib/scheduler";
import { loadSourceRegistry } from "@/lib/sources";

const fixture = `
<div class="page-text-content">
  <div class="col-12 col-md-6 col-lg-4 mt-5" id="bx_3218110189_9999">
    <div class="main-news"><div class="main-news--date-d">13</div><div class="main-news--date-my">сентября</div>
    <div class="h5 main-news--title">Изменена остановка общественного транспорта</div>
    <a href="/ru/press-center/news/test-live-item/" class="main-news--link"></a></div>
  </div>
</div>`;
const tempRoots: string[] = [];

async function tempStore(): Promise<JsonRuntimeStore> {
  const root = await mkdtemp(path.join(tmpdir(), "010000-runtime-"));
  tempRoots.push(root);
  return new JsonRuntimeStore(path.join(root, "state.json"));
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("persistent runtime and collection isolation", () => {
  it("loads legacy runtime files as pipeline version 1 for one-time rebuild", () => {
    const current = createEmptyRuntimeState("2026-09-13T00:00:00.000Z");
    const legacy = structuredClone(current) as unknown as Record<string, unknown>;
    delete legacy.pipeline_version;
    expect(runtimeStateSchema.parse(legacy).pipeline_version).toBe(1);
  });

  it("round-trips a schema-validated runtime state", async () => {
    const store = await tempStore();
    const state = createEmptyRuntimeState("2026-09-13T00:00:00.000Z");
    await store.write(state);
    await expect(store.read()).resolves.toEqual(state);
    expect(JSON.parse(await readFile(store.filePath, "utf8"))).toMatchObject({ version: 1 });
  });

  it("persists successful evidence when another adapter fails", async () => {
    const store = await tempStore();
    const cts = new CtsAdapter(async () => new Response(fixture, {
      status: 200,
      headers: { "content-type": "text/html" },
    }));
    const failed: SourceAdapter = {
      source_id: "astana-rek",
      discover: async () => { throw new Error("simulated source outage"); },
      fetch: async () => "",
      parse: () => [],
      normalize: () => { throw new Error("not reached"); },
      healthCheck: async () => ({ ok: false, live_collection: false, source_id: "astana-rek", checked_at: new Date().toISOString(), details: "simulated" }),
    };
    const state = await collectLiveSources({ adapters: [cts, failed], registry: loadSourceRegistry(), store });
    expect(state.collection_runs.at(-1)?.status).toBe("partial");
    expect(state.raw_items).toHaveLength(1);
    expect(state.event_records).toHaveLength(1);
    expect(state.event_records[0].event).toMatchObject({ data_mode: "live", safety: "PASS" });
    await expect(store.read()).resolves.toMatchObject({ raw_items: expect.any(Array) });

    const second = await collectLiveSources({ adapters: [cts, failed], registry: loadSourceRegistry(), store });
    expect(second.raw_items).toHaveLength(1);
    expect(second.event_records).toHaveLength(1);
    expect(second.extraction_runs).toHaveLength(state.extraction_runs.length);
    expect(second.collection_runs.at(-1)?.sources[0]).toMatchObject({ created: 0, duplicates: 1 });
  });
});
