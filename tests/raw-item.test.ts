import { describe, expect, it } from "vitest";
import {
  RawItemError,
  computeContentHash,
  createRawItem,
  validateRawItem,
} from "@/lib/raw-items";

const validDraft = {
  source_id: "astana-akimat",
  source_url: "https://www.gov.kz/memleket/entities/astana/press/news/1",
  external_id: "news-1",
  headline: "Road works on Turan Avenue",
  raw_text: "One lane is closed until 18:00.",
  published_at: "2026-09-12T06:00:00.000Z",
  retrieved_at: "2026-09-12T06:05:00.000Z",
  language: "ru",
};

describe("RawItem model", () => {
  it("creates a valid RawItem with a deterministic hash and id", () => {
    const first = createRawItem(validDraft);
    const second = createRawItem(validDraft);

    expect(first.content_hash).toBe(computeContentHash(validDraft.headline, validDraft.raw_text));
    expect(first.id).toBe(second.id);
    expect(first.id.startsWith("ri_")).toBe(true);
    expect(first.ingestion_status).toBe("discovered");
    expect(validateRawItem(first)).toEqual(first);
  });

  it("rejects an invalid source URL", () => {
    expect(() =>
      createRawItem({
        ...validDraft,
        source_url: "not-a-url",
      }),
    ).toThrow(RawItemError);
  });

  it("rejects a non-failed item without headline and raw_text", () => {
    expect(() =>
      createRawItem({
        ...validDraft,
        headline: null,
        raw_text: null,
      }),
    ).toThrow(/headline or raw_text/);
  });

  it("requires an error when status is failed", () => {
    expect(() =>
      createRawItem({
        ...validDraft,
        ingestion_status: "failed",
        error: null,
      }),
    ).toThrow(/must include an error/);

    const failed = createRawItem({
      ...validDraft,
      ingestion_status: "failed",
      error: "timeout",
    });
    expect(failed.error).toBe("timeout");
  });
});
