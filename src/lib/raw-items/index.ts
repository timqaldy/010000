export { createRawItem, RawItemError, validateRawItem } from "./create";
export { findDuplicate } from "./dedupe";
export type { DedupeDecision, DedupeMatch } from "./dedupe";
export { canonicalizeUrl, computeContentHash, computeRawItemId, normalizeEvidenceText } from "./hash";
export { MemoryRawItemStore } from "./store";
export type { InsertRawItemResult } from "./store";
export { rawItemSchema } from "./schema";
export { INGESTION_STATUSES } from "./types";
export type { IngestionStatus, RawItem, RawItemDraft } from "./types";
