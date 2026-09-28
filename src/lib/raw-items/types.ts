export const INGESTION_STATUSES = [
  "discovered",
  "normalized",
  "failed",
  "skipped",
] as const;

export type IngestionStatus = (typeof INGESTION_STATUSES)[number];

export type RawItem = {
  id: string;
  source_id: string;
  source_url: string;
  external_id: string | null;
  headline: string | null;
  raw_text: string | null;
  published_at: string | null;
  retrieved_at: string;
  content_hash: string;
  language: string | null;
  ingestion_status: IngestionStatus;
  error: string | null;
};

export type RawItemDraft = {
  source_id: string;
  source_url: string;
  external_id?: string | null;
  headline?: string | null;
  raw_text?: string | null;
  published_at?: string | null;
  retrieved_at?: string;
  language?: string | null;
  ingestion_status?: IngestionStatus;
  error?: string | null;
};
