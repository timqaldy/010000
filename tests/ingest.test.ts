import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ingestPayload } from "@/lib/ingest";
import { MemoryRawItemStore } from "@/lib/raw-items";

const ctsHtml = readFileSync(resolve(process.cwd(), "tests/fixtures/cts/news-listing.html"), "utf8");
const rekHtml = readFileSync(resolve(process.cwd(), "tests/fixtures/astana-rek/news-listing.html"), "utf8");
const akimatJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "tests/fixtures/gov-kz/astana-akimat-news.json"), "utf8"),
);

describe("manual ingest runner", () => {
  it("ingests a CTS fixture and deduplicates the second run", () => {
    const store = new MemoryRawItemStore();
    const first = ingestPayload({ sourceId: "cts", payload: ctsHtml, store });
    const second = ingestPayload({ sourceId: "cts", payload: ctsHtml, store });

    expect(first.status).toBe("ok");
    expect(first.items_discovered).toBe(2);
    expect(first.items_created).toBe(2);
    expect(first.items_skipped).toBe(0);
    expect(first.run_id.startsWith("run_")).toBe(true);

    expect(second.status).toBe("ok");
    expect(second.items_created).toBe(0);
    expect(second.items_skipped).toBe(2);
    expect(store.list()).toHaveLength(2);
  });

  it("ingests Astana-REK and Akimat fixtures into the same store", () => {
    const store = new MemoryRawItemStore();
    const rek = ingestPayload({ sourceId: "astana-rek", payload: rekHtml, store });
    const akimat = ingestPayload({ sourceId: "astana-akimat", payload: akimatJson, store });

    expect(rek.items_created).toBe(2);
    expect(akimat.items_created).toBe(1);
    expect(store.list().map((item) => item.source_id).sort()).toEqual([
      "astana-akimat",
      "astana-rek",
      "astana-rek",
    ]);
  });

  it("fails closed for prohibited, disabled, and unknown sources", () => {
    const store = new MemoryRawItemStore();

    expect(ingestPayload({ sourceId: "telegram", payload: ctsHtml, store }).status).toBe("failed");
    expect(ingestPayload({ sourceId: "kazinform", payload: ctsHtml, store }).errors[0]?.message).toMatch(/disabled/);
    expect(ingestPayload({ sourceId: "visit-astana", payload: ctsHtml, store }).errors[0]?.message).toMatch(
      /No adapter registered|disabled/,
    );
    expect(store.list()).toHaveLength(0);
  });

  it("contains a parse failure to one run and does not throw", () => {
    const store = new MemoryRawItemStore();
    const run = ingestPayload({ sourceId: "cts", payload: { not: "html" }, store });

    expect(run.status).toBe("failed");
    expect(run.items_created).toBe(0);
    expect(run.errors.length).toBeGreaterThan(0);
  });
});
