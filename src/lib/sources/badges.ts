import type { BadgeTone, ReuseStatus, SourceRecord } from "./types";

export function reuseStatusBadge(status: ReuseStatus): BadgeTone {
  switch (status) {
    case "OPEN":
    case "LICENSED":
      return "GREEN";
    case "FACTS_ONLY":
    case "REVIEW_REQUIRED":
      return "YELLOW";
    case "PROHIBITED":
      return "RED";
  }
}

export function enabledBadge(source: Pick<SourceRecord, "enabled" | "reuse_status">): BadgeTone {
  if (source.reuse_status === "PROHIBITED") {
    return "RED";
  }
  return source.enabled ? "GREEN" : "YELLOW";
}
