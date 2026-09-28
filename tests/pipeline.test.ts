import { describe, expect, it } from "vitest";
import { AstanaDchsAdapter, AstanaTransportAdapter } from "@/lib/adapters";
import { getDemoEventRecords, getDemoPipelineMetrics } from "@/lib/demo-feed";
import { processRawItems } from "@/lib/pipeline";
import { createRawItem } from "@/lib/raw-items";
import { checkSourceHealth } from "@/lib/scheduler";
import { loadSourceRegistry } from "@/lib/sources";

function raw(source_id: string, suffix: string, retrieved_at: string) {
  return createRawItem({
    source_id,
    source_url: `https://example.com/${source_id}/${suffix}`,
    external_id: suffix,
    headline: "Перекрыто движение на улице Сыганак",
    raw_text: "На улице Сыганак временно перекрыто движение транспорта.",
    published_at: "2026-09-12T09:00:00.000Z",
    retrieved_at,
    language: "ru",
    ingestion_status: "normalized",
  });
}

describe("end-to-end Event pipeline", () => {
  it("creates one Event and a revision from two independent reports", () => {
    const result = processRawItems([
      raw("astana-akimat", "one", "2026-09-12T09:01:00.000Z"),
      raw("astana-transport", "two", "2026-09-12T09:05:00.000Z"),
    ], loadSourceRegistry(), "fixture");
    expect(result.records).toHaveLength(1);
    expect(result.records[0].sources).toHaveLength(2);
    expect(result.records[0].revisions).toHaveLength(1);
    expect(result.records[0].event).toMatchObject({ lifecycle: "UPDATED", source_count: 2, safety: "PASS" });
    expect(result.records[0].event.published_at).not.toBeNull();
  });

  it("publishes the fixture-backed demo through the same pipeline", () => {
    const published = getDemoEventRecords();
    expect(published.length).toBeGreaterThanOrEqual(3);
    expect(published.every(({ event }) => event.safety === "PASS" && event.importance >= 0.55)).toBe(true);
    expect(published.some(({ event }) => event.title.includes("ремонтная кампания"))).toBe(false);
    expect(getDemoPipelineMetrics()).toMatchObject({ rejected: 0, extraction_provider: expect.stringContaining("AI provider not configured") });
  });

  it("provides schema-compatible adapters for all gov.kz P0 entities", () => {
    expect(new AstanaDchsAdapter().source_id).toBe("astana-dchs");
    expect(new AstanaTransportAdapter().source_id).toBe("astana-transport");
  });

  it("marks an explicitly restored event as resolved", () => {
    const result = processRawItems([createRawItem({
      source_id: "cts",
      source_url: "https://cts.gov.kz/restored",
      headline: "Движение автобусов восстановлено",
      raw_text: "CTS сообщает, что движение автобусов восстановлено.",
      retrieved_at: "2026-09-13T01:00:00.000Z",
    })], loadSourceRegistry(), "fixture");
    expect(result.records[0].event.lifecycle).toBe("RESOLVED");
  });

  it("reports all five enabled P0 sources without claiming blocked gov.kz live", async () => {
    const health = await checkSourceHealth(loadSourceRegistry());
    expect(health).toHaveLength(5);
    expect(health.filter((item) => item.live_collection === "available").map((item) => item.source_id).sort()).toEqual(["astana-rek", "cts"]);
  });
});
