import type { EventRecord } from "@/lib/events";
import { getDemoEventRecord, getDemoEventRecords } from "@/lib/demo-feed";
import { runtimeStore } from "./store";

export async function getEventRecords(): Promise<{ mode: "live" | "fixture"; records: EventRecord[] }> {
  const state = await runtimeStore.read();
  const live = state.event_records
    .filter((record) => record.event.published_at !== null)
    .sort((a, b) => Date.parse(b.event.updated_at) - Date.parse(a.event.updated_at));
  return live.length > 0 ? { mode: "live", records: live } : { mode: "fixture", records: getDemoEventRecords() };
}

export async function getEventRecord(idOrSlug: string): Promise<EventRecord | undefined> {
  const feed = await getEventRecords();
  return feed.records.find(({ event }) => event.id === idOrSlug || event.slug === idOrSlug)
    ?? (feed.mode === "fixture" ? getDemoEventRecord(idOrSlug) : undefined);
}
