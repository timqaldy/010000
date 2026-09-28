import { describe, expect, it } from "vitest";
import { fetchPublicHtml } from "@/lib/adapters/http";

describe("public HTML transport", () => {
  it("retries 5xx responses with bounded backoff", async () => {
    let calls = 0;
    const html = await fetchPublicHtml({
      url: "https://example.com/news",
      sourceId: "example",
      retries: 2,
      retryDelayMs: 0,
      sleepImpl: async () => undefined,
      fetchImpl: async () => {
        calls += 1;
        return calls < 3
          ? new Response("unavailable", { status: 503 })
          : new Response("<html>ok</html>", { status: 200, headers: { "content-type": "text/html" } });
      },
    });
    expect(html).toContain("ok");
    expect(calls).toBe(3);
  });

  it("does not retry a non-retryable 404", async () => {
    let calls = 0;
    await expect(fetchPublicHtml({
      url: "https://example.com/missing",
      sourceId: "example",
      sleepImpl: async () => undefined,
      fetchImpl: async () => {
        calls += 1;
        return new Response("missing", { status: 404 });
      },
    })).rejects.toThrow(/HTTP 404/);
    expect(calls).toBe(1);
  });
});
