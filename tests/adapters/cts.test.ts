import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CtsAdapter } from "@/lib/adapters";
import { MemoryRawItemStore } from "@/lib/raw-items";

const fixture = readFileSync(resolve(process.cwd(), "tests/fixtures/cts/news-listing.html"), "utf8");

describe("CTS adapter", () => {
  const adapter = new CtsAdapter();

  it("parses observed listing cards from fixture HTML", () => {
    const cards = adapter.parse(fixture);
    expect(cards).toHaveLength(2);
  });

  it("normalizes URL and title and does not invent a year", () => {
    const [first] = adapter.parse(fixture);
    const item = adapter.normalize(first);

    expect(item.source_id).toBe("cts");
    expect(item.external_id).toBe("3548");
    expect(item.headline).toContain("The Square");
    expect(item.source_url).toBe(
      "https://cts.gov.kz/ru/press-center/news/izmenen-poryadok-ostanovki-obshchestvennogo-transporta-na-ostanovochnykh-punktakh-bts-the-square-i-b/",
    );
    expect(item.published_at).toBeNull();
  });

  it("deduplicates repeated listing cards", () => {
    const store = new MemoryRawItemStore();
    const [first] = adapter.parse(fixture);
    expect(store.insert(adapter.normalize(first)).kind).toBe("created");
    expect(store.insert(adapter.normalize(first)).kind).toBe("duplicate");
  });

  it("fetches and discovers the public listing through an injected HTTP client", async () => {
    const liveAdapter = new CtsAdapter(async () => new Response(fixture, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }));
    await expect(liveAdapter.discover()).resolves.toHaveLength(2);
    await expect(liveAdapter.healthCheck()).resolves.toMatchObject({ ok: true, live_collection: true });
  });

  it("fails closed on an HTTP error", async () => {
    const liveAdapter = new CtsAdapter(async () => new Response("unavailable", { status: 503 }));
    await expect(liveAdapter.fetch()).rejects.toThrow(/HTTP 503/);
  });
});
