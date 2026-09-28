export const EVENT_CATEGORIES = [
  "TRAFFIC",
  "TRANSPORT",
  "EMERGENCY",
  "UTILITIES",
  "CITY",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_LIFECYCLES = [
  "DETECTED",
  "VERIFYING",
  "UNCONFIRMED",
  "CONFIRMED",
  "ACTIVE",
  "UPDATED",
  "CONFLICTED",
  "RESOLVED",
  "ARCHIVED",
  "REJECTED",
] as const;

export type EventLifecycle = (typeof EVENT_LIFECYCLES)[number];

export const EVENT_SOURCE_ROLES = [
  "PRIMARY",
  "CONFIRMING",
  "CONTRADICTING",
  "UPDATE",
] as const;

export type EventSourceRole = (typeof EVENT_SOURCE_ROLES)[number];
export type SafetyOutcome = "PASS" | "FAIL" | "REVIEW";
export type DataMode = "fixture" | "live";

export type EventLocation = {
  label: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type CityEvent = {
  id: string;
  slug: string;
  category: EventCategory;
  title: string;
  summary: string;
  lifecycle: EventLifecycle;
  location: EventLocation | null;
  starts_at: string | null;
  ends_at: string | null;
  detected_at: string;
  updated_at: string;
  confidence: number;
  importance: number;
  safety: SafetyOutcome;
  published_at: string | null;
  source_count: number;
  claims: string[];
  data_mode: DataMode;
};

export type EventSource = {
  id: string;
  event_id: string;
  raw_item_id: string;
  source_id: string;
  source_name: string;
  source_url: string;
  role: EventSourceRole;
  independent: boolean;
  observed_at: string;
};

export type EventRevision = {
  id: string;
  event_id: string;
  created_at: string;
  reason: string;
  changed_fields: string[];
  snapshot: CityEvent;
};

export type EventRecord = {
  event: CityEvent;
  sources: EventSource[];
  revisions: EventRevision[];
};
