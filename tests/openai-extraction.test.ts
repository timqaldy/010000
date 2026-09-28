import { describe, expect, it } from "vitest";
import { AiExtractionError, OpenAIEventExtractor } from "@/lib/extraction";
import { createRawItem } from "@/lib/raw-items";

const raw = createRawItem({
  source_id: "astana-akimat",
  source_url: "https://www.gov.kz/example",
  headline: "Перекрыто движение на улице Сыганак",
  raw_text: "Движение перекрыто 13 сентября 2026 года.",
  retrieved_at: "2026-09-13T01:00:00.000Z",
});

describe("OpenAI structured extraction provider", () => {
  it("submits strict JSON Schema and validates the structured result", async () => {
    let requestBody: Record<string, unknown> | undefined;
    let authorization: string | null = null;
    const extractor = new OpenAIEventExtractor({
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: async (_input, init) => {
        requestBody = JSON.parse(String(init?.body));
        authorization = new Headers(init?.headers).get("authorization");
        return new Response(JSON.stringify({
          status: "completed",
          output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({
            category: "TRAFFIC",
            title: "Перекрыто движение на улице Сыганак",
            summary: "На улице Сыганак перекрыто движение транспорта.",
            location: { label: "улица Сыганак", district: null, latitude: null, longitude: null },
            starts_at: "2026-09-13T00:00:00+05:00",
            ends_at: null,
            claims: ["Движение перекрыто 13 сентября 2026 года."],
          }) }] }],
          usage: { input_tokens: 100, output_tokens: 50 },
        }), { status: 200, headers: { "content-type": "application/json" } });
      },
    });

    const result = await extractor.extract(raw);
    expect(result.candidate).toMatchObject({ category: "TRAFFIC", starts_at: "2026-09-13T00:00:00+05:00" });
    expect(result.run).toMatchObject({ provider: "ai", model: "test-model", input_tokens: 100, output_tokens: 50, status: "ok" });
    expect(authorization).toBe("Bearer test-key");
    expect(requestBody).toMatchObject({ text: { format: { type: "json_schema", strict: true } } });
    expect(JSON.stringify(requestBody)).toContain("<SOURCE_DATA>");
  });

  it("fails closed and preserves failed-run telemetry", async () => {
    const extractor = new OpenAIEventExtractor({
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: async () => new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 }),
    });
    try {
      await extractor.extract(raw);
      throw new Error("expected extraction to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AiExtractionError);
      expect((error as AiExtractionError).run).toMatchObject({ provider: "ai", status: "failed", error: "rate limited" });
    }
  });

  it("rejects schema-invalid model output", async () => {
    const extractor = new OpenAIEventExtractor({
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: async () => new Response(JSON.stringify({ status: "completed", output_text: "{}" }), { status: 200 }),
    });
    await expect(extractor.extract(raw)).rejects.toBeInstanceOf(AiExtractionError);
  });
});
