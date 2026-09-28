import { AdapterError } from "./errors";

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type SleepLike = (milliseconds: number) => Promise<void>;

class RetryableHttpError extends Error {}

export async function fetchPublicHtml(input: {
  url: string;
  sourceId: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  sleepImpl?: SleepLike;
}): Promise<string> {
  const retries = input.retries ?? 2;
  const sleep = input.sleepImpl ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  let lastError: unknown;
  let attempts = 0;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    attempts = attempt + 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 8_000);
    try {
      const response = await (input.fetchImpl ?? fetch)(input.url, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "010000.kz-local-mvp/0.1 (facts-only city event monitor)",
        },
        redirect: "follow",
        signal: controller.signal,
      });
      if (!response.ok) {
        const message = `${input.sourceId} returned HTTP ${response.status}`;
        if (response.status === 429 || response.status >= 500) throw new RetryableHttpError(message);
        throw new AdapterError(message);
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType && !contentType.includes("text/html")) {
        throw new AdapterError(`${input.sourceId} returned unexpected content-type ${contentType}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      const retryable = error instanceof RetryableHttpError || !(error instanceof AdapterError);
      if (!retryable || attempt === retries) break;
    } finally {
      clearTimeout(timeout);
    }
    await sleep((input.retryDelayMs ?? 250) * 2 ** attempt);
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new AdapterError(`${input.sourceId} live fetch failed after ${attempts} attempt(s): ${message}`);
}
