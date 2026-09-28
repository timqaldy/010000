import { findDuplicate } from "./dedupe";
import type { RawItem } from "./types";

export type InsertRawItemResult =
  | { kind: "created"; item: RawItem }
  | { kind: "duplicate"; item: RawItem; matchedBy: "external_id" | "source_url" | "content_hash" };

export class MemoryRawItemStore {
  private readonly items: RawItem[] = [];

  list(): RawItem[] {
    return [...this.items];
  }

  insert(item: RawItem): InsertRawItemResult {
    const decision = findDuplicate(this.items, item);
    if (decision.kind === "duplicate") {
      return { kind: "duplicate", item: decision.existing, matchedBy: decision.matchedBy };
    }
    this.items.push(item);
    return { kind: "created", item };
  }
}
