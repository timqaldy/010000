import type { EventCategory, EventLocation } from "@/lib/events";

export type EventCandidate = {
  category: EventCategory;
  title: string;
  summary: string;
  location: EventLocation | null;
  starts_at: string | null;
  ends_at: string | null;
  claims: string[];
};

export type ExtractionRun = {
  id: string;
  raw_item_id: string;
  provider: "deterministic" | "ai";
  model: string;
  prompt_version: string;
  schema_version: string;
  started_at: string;
  finished_at: string;
  latency_ms: number;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  status: "ok" | "failed";
  error: string | null;
};

export type ExtractionResult = {
  candidate: EventCandidate;
  run: ExtractionRun;
};
