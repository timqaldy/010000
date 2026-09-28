import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ASTREC_OUTAGE_URL, AstanaRekAdapter } from "@/lib/adapters";
import { MemoryRawItemStore } from "@/lib/raw-items";

const newsFixture = readFileSync(
  resolve(process.cwd(), "tests/fixtures/astana-rek/news-listing.html"),
  "utf8",
);
const outageFixture = readFileSync(
  resolve(process.cwd(), "tests/fixtures/astana-rek/outage-bulletin.html"),
  "utf8",
);

describe("Astana-REK adapter", () => {
  const adapter = new AstanaRekAdapter();

  it("parses observed news cards and ignores sidebar links", () => {
    const cards = adapter.parse(newsFixture);
    expect(cards).toHaveLength(2);
  });

  it("normalizes the datetime attribute and does not keep images", () => {
    const [first] = adapter.parse(newsFixture);
    const item = adapter.normalize(first);

    expect(item.source_id).toBe("astana-rek");
    expect(item.external_id).toBe(
      "natsionalnyi-proekt-2026-rekonstruktsiia-raspredelitelnyh-setei-20-10-04-kv-v-ramkah-realizatsii-natsionalnogo-proekta",
    );
    expect(item.source_url).toContain("/news/natsionalnyi-proekt-2026");
    expect(item.published_at).toBe("2026-07-19T00:00:00.000Z");
    expect(item.headline).toContain("Реконструкция");
    expect(item.raw_text).not.toContain("uploads/image");
  });

  it("treats the outage page as one bulletin and does not store the address list", () => {
    const [bulletin] = adapter.parse(outageFixture);
    const item = adapter.normalize(bulletin);

    expect(item.source_url).toBe(ASTREC_OUTAGE_URL);
    expect(item.headline).toBe("Плановые отключения электроэнергии");
    expect(item.raw_text).toContain("11.09.2026");
    expect(item.raw_text).not.toContain("Енлик Кебек");
    expect(item.published_at).toBeNull();
  });

  it("deduplicates repeated news cards", () => {
    const store = new MemoryRawItemStore();
    const [first] = adapter.parse(newsFixture);
    expect(store.insert(adapter.normalize(first)).kind).toBe("created");
    expect(store.insert(adapter.normalize(first)).kind).toBe("duplicate");
  });

  it("fetches and discovers the public listing through an injected HTTP client", async () => {
    const liveAdapter = new AstanaRekAdapter(async () => new Response(newsFixture, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }));
    await expect(liveAdapter.discover()).resolves.toHaveLength(2);
    await expect(liveAdapter.healthCheck()).resolves.toMatchObject({ ok: true, live_collection: true });
  });
});
