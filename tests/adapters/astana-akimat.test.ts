import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AdapterBlockedError, AstanaAkimatAdapter } from "@/lib/adapters";
import { MemoryRawItemStore } from "@/lib/raw-items";

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), "tests/fixtures/gov-kz/astana-akimat-news.json"), "utf8"),
);

describe("Astana Akimat adapter", () => {
  const adapter = new AstanaAkimatAdapter();

  it("parses the observed gov.kz news schema and skips invalid rows", () => {
    const parsed = adapter.parse(fixture);
    expect(parsed).toHaveLength(1);
  });

  it("normalizes FACTS_ONLY fields and does not keep full HTML content", () => {
    const [record] = adapter.parse(fixture);
    const item = adapter.normalize(record);

    expect(item.source_id).toBe("astana-akimat");
    expect(item.external_id).toBe("1245600");
    expect(item.source_url).toBe(
      "https://www.gov.kz/memleket/entities/astana/press/news/details/1245600",
    );
    expect(item.headline).toContain("Сыганак");
    expect(item.raw_text).toContain("23 по 24 июня");
    expect(item.raw_text).not.toContain("Полный текст статьи");
    expect(item.ingestion_status).toBe("normalized");
  });

  it("deduplicates repeated fixture ingest", () => {
    const store = new MemoryRawItemStore();
    const [record] = adapter.parse(fixture);
    const first = store.insert(adapter.normalize(record));
    const second = store.insert(adapter.normalize(record));

    expect(first.kind).toBe("created");
    expect(second.kind).toBe("duplicate");
    expect(store.list()).toHaveLength(1);
  });

  it("does not implement live discover/fetch against the ticket-gated API", async () => {
    await expect(adapter.discover()).rejects.toBeInstanceOf(AdapterBlockedError);
    await expect(adapter.fetch()).rejects.toBeInstanceOf(AdapterBlockedError);

    const health = await adapter.healthCheck();
    expect(health.ok).toBe(false);
    expect(health.details).toMatch(/ticket/i);
  });
});
