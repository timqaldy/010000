import { canonicalizeUrl } from "./hash";
import type { RawItem } from "./types";

export type DedupeMatch = "external_id" | "source_url" | "content_hash";

export type DedupeDecision =
  | { kind: "new" }
  | { kind: "duplicate"; existing: RawItem; matchedBy: DedupeMatch };

export function findDuplicate(existing: readonly RawItem[], incoming: RawItem): DedupeDecision {
  if (incoming.external_id) {
    const byExternalId = existing.find(
      (item) => item.source_id === incoming.source_id && item.external_id === incoming.external_id,
    );
    if (byExternalId) {
      return { kind: "duplicate", existing: byExternalId, matchedBy: "external_id" };
    }
  }

  const incomingUrl = canonicalizeUrl(incoming.source_url);
  const byUrl = existing.find(
    (item) => item.source_id === incoming.source_id && canonicalizeUrl(item.source_url) === incomingUrl,
  );
  if (byUrl) {
    return { kind: "duplicate", existing: byUrl, matchedBy: "source_url" };
  }

  const byHash = existing.find(
    (item) => item.source_id === incoming.source_id && item.content_hash === incoming.content_hash,
  );
  if (byHash) {
    return { kind: "duplicate", existing: byHash, matchedBy: "content_hash" };
  }

  return { kind: "new" };
}
