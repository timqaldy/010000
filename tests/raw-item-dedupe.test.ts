import { describe, expect, it } from "vitest";
import { MemoryRawItemStore, createRawItem, findDuplicate } from "@/lib/raw-items";

function item(overrides: Record<string, unknown> = {}) {
  return createRawItem({
    source_id: "astana-akimat",
    source_url: "https://www.gov.kz/memleket/entities/astana/press/news/1",
    external_id: "news-1",
    headline: "Road works on Turan Avenue",
    raw_text: "One lane is closed until 18:00.",
    published_at: "2026-09-12T06:00:00.000Z",
    retrieved_at: "2026-09-12T06:05:00.000Z",
    language: "ru",
    ...overrides,
  });
}

describe("RawItem deterministic deduplication", () => {
  it("matches external_id before URL and hash", () => {
    const existing = item();
    const incoming = item({
      source_url: "https://www.gov.kz/memleket/entities/astana/press/news/other",
      headline: "Different headline",
      raw_text: "Different body",
    });

    const decision = findDuplicate([existing], incoming);
    expect(decision.kind).toBe("duplicate");
    if (decision.kind === "duplicate") {
      expect(decision.matchedBy).toBe("external_id");
      expect(decision.existing.id).toBe(existing.id);
    }
  });

  it("matches canonical source URL when external_id is absent", () => {
    const existing = item({ external_id: null });
    const incoming = item({
      external_id: null,
      source_url: "https://www.gov.kz/memleket/entities/astana/press/news/1/",
      headline: "Changed title",
      raw_text: "Changed body",
    });

    const decision = findDuplicate([existing], incoming);
    expect(decision.kind).toBe("duplicate");
    if (decision.kind === "duplicate") {
      expect(decision.matchedBy).toBe("source_url");
    }
  });

  it("matches content hash when id and URL differ", () => {
    const existing = item({ external_id: null });
    const incoming = item({
      external_id: null,
      source_url: "https://www.gov.kz/memleket/entities/astana/press/news/2",
    });

    const decision = findDuplicate([existing], incoming);
    expect(decision.kind).toBe("duplicate");
    if (decision.kind === "duplicate") {
      expect(decision.matchedBy).toBe("content_hash");
    }
  });

  it("treats the same content from another source as new evidence", () => {
    const existing = item();
    const incoming = item({ source_id: "cts" });
    expect(findDuplicate([existing], incoming).kind).toBe("new");
  });

  it("does not insert duplicates into the store", () => {
    const store = new MemoryRawItemStore();
    const first = store.insert(item());
    const second = store.insert(item());

    expect(first.kind).toBe("created");
    expect(second.kind).toBe("duplicate");
    expect(store.list()).toHaveLength(1);
  });
});
