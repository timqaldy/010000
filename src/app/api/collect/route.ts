import { NextResponse } from "next/server";
import { collectLiveSources } from "@/lib/scheduler";

export async function POST(request: Request) {
  const expectedToken = process.env.COLLECTION_TRIGGER_TOKEN;
  if (!expectedToken) {
    return NextResponse.json({ error: "manual collection trigger is disabled" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const state = await collectLiveSources();
  return NextResponse.json({
    status: state.collection_runs.at(-1)?.status ?? "failed",
    updated_at: state.updated_at,
    raw_items: state.raw_items.length,
    events: state.event_records.length,
    last_collection: state.collection_runs.at(-1) ?? null,
  });
}
