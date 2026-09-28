export const REUSE_STATUSES = [
  "OPEN",
  "FACTS_ONLY",
  "LICENSED",
  "REVIEW_REQUIRED",
  "PROHIBITED",
] as const;

export type ReuseStatus = (typeof REUSE_STATUSES)[number];

export const FETCH_METHODS = [
  "html",
  "rss",
  "api",
  "manual",
  "unknown",
] as const;

export type FetchMethod = (typeof FETCH_METHODS)[number];

export const ROBOTS_STATUSES = [
  "unknown",
  "allowed",
  "restricted",
  "blocked",
] as const;

export type RobotsStatus = (typeof ROBOTS_STATUSES)[number];

export const COMMERCIAL_USE_STATUSES = [
  "unknown",
  "allowed",
  "restricted",
  "prohibited",
] as const;

export type CommercialUseStatus = (typeof COMMERCIAL_USE_STATUSES)[number];

export type SourceRecord = {
  source_id: string;
  name: string;
  canonical_url: string;
  category: string;
  owner: string;
  official: boolean;
  fetch_method: FetchMethod;
  priority: number;
  enabled: boolean;
  robots_status: RobotsStatus;
  terms_url: string | null;
  reuse_status: ReuseStatus;
  allowed_fields: string[];
  fulltext_storage_allowed: boolean;
  image_reuse_allowed: boolean;
  commercial_use_status: CommercialUseStatus;
  attribution_required: boolean;
  fetch_interval_minutes: number;
  confidence_weight: number;
  last_reviewed_at: string | null;
  notes: string;
};

export type BadgeTone = "GREEN" | "YELLOW" | "RED";
