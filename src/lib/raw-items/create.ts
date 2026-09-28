import { rawItemSchema } from "./schema";
import { computeContentHash, computeRawItemId } from "./hash";
import type { RawItem, RawItemDraft } from "./types";

export class RawItemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RawItemError";
  }
}

export function createRawItem(draft: RawItemDraft): RawItem {
  try {
    const url = new URL(draft.source_url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new RawItemError(`source_url is not a valid http(s) URL: ${draft.source_url}`);
  }

  const contentHash = computeContentHash(draft.headline, draft.raw_text);
  const item: RawItem = {
    id: computeRawItemId(draft.source_id, draft.source_url, contentHash),
    source_id: draft.source_id,
    source_url: draft.source_url,
    external_id: draft.external_id ?? null,
    headline: draft.headline ?? null,
    raw_text: draft.raw_text ?? null,
    published_at: draft.published_at ?? null,
    retrieved_at: draft.retrieved_at ?? new Date().toISOString(),
    content_hash: contentHash,
    language: draft.language ?? null,
    ingestion_status: draft.ingestion_status ?? "discovered",
    error: draft.error ?? null,
  };

  const parsed = rawItemSchema.safeParse(item);
  if (!parsed.success) {
    throw new RawItemError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  return parsed.data;
}

export function validateRawItem(input: unknown): RawItem {
  const parsed = rawItemSchema.safeParse(input);
  if (!parsed.success) {
    throw new RawItemError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  return parsed.data;
}
