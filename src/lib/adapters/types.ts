import type { RawItem } from "@/lib/raw-items";

export type AdapterHealth = {
  ok: boolean;
  live_collection: boolean;
  source_id: string;
  checked_at: string;
  details: string;
};

export type SourceAdapter = {
  source_id: string;
  discover(): Promise<unknown[]>;
  fetch(): Promise<unknown>;
  parse(payload: unknown): unknown[];
  normalize(record: unknown): RawItem;
  healthCheck(): Promise<AdapterHealth>;
};
