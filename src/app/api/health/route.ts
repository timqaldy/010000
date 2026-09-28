import { NextResponse } from "next/server";
import { checkSourceHealth } from "@/lib/scheduler";
import { runtimeStore } from "@/lib/runtime";
import { loadSourceRegistry } from "@/lib/sources";

export async function GET() {
  const [state, sources] = await Promise.all([runtimeStore.read(), checkSourceHealth(loadSourceRegistry())]);
  const liveReady = sources.filter((source) => source.live_collection === "available").length;
  return NextResponse.json({
    status: liveReady === sources.length ? "ok" : "degraded",
    mode: state.event_records.length ? "live" : "fixture-fallback",
    updated_at: state.updated_at,
    live_sources: `${liveReady}/${sources.length}`,
    raw_items: state.raw_items.length,
    events: state.event_records.length,
    collection_runs: state.collection_runs.length,
    last_collection: state.collection_runs.at(-1) ?? null,
  });
}
