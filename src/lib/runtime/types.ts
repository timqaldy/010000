import type { EventRecord } from "@/lib/events";
import type { ExtractionRun } from "@/lib/extraction";
import type { RawItem } from "@/lib/raw-items";

export type CollectionSourceResult = {
  source_id: string;
  status: "ok" | "failed";
  discovered: number;
  created: number;
  duplicates: number;
  error: string | null;
};

export type CollectionRun = {
  id: string;
  started_at: string;
  finished_at: string;
  status: "ok" | "partial" | "failed";
  sources: CollectionSourceResult[];
};

export type RuntimeState = {
  version: 1;
  pipeline_version: number;
  updated_at: string;
  raw_items: RawItem[];
  event_records: EventRecord[];
  extraction_runs: ExtractionRun[];
  collection_runs: CollectionRun[];
};
