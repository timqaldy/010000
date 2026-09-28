import { createRawItem } from "@/lib/raw-items";
import type { RawItem } from "@/lib/raw-items";
import { AdapterError } from "../errors";
import { assertSourceMayIngest } from "../registry-gate";
import type { AdapterHealth, SourceAdapter } from "../types";
import { fetchPublicHtml, type FetchLike } from "../http";
import { parseCtsNewsListing, resolveCtsUrl, type CtsNewsCard } from "./parse-listing";

export const CTS_SOURCE_ID = "cts";
export const CTS_NEWS_LISTING_URL = "https://cts.gov.kz/ru/press-center/news/";

export class CtsAdapter implements SourceAdapter {
  readonly source_id = CTS_SOURCE_ID;

  constructor(private readonly fetchImpl?: FetchLike) {}

  async discover(): Promise<unknown[]> {
    return this.parse(await this.fetch());
  }

  async fetch(): Promise<unknown> {
    return fetchPublicHtml({ url: CTS_NEWS_LISTING_URL, sourceId: this.source_id, fetchImpl: this.fetchImpl });
  }

  parse(payload: unknown): unknown[] {
    if (typeof payload !== "string") {
      throw new AdapterError("CTS adapter parse() expects listing HTML");
    }
    return parseCtsNewsListing(payload);
  }

  normalize(record: unknown): RawItem {
    assertSourceMayIngest(this.source_id);
    const card = record as CtsNewsCard;
    if (!card?.title || !card.path) {
      throw new AdapterError("CTS adapter received an incomplete news card");
    }

    return createRawItem({
      source_id: this.source_id,
      source_url: resolveCtsUrl(card.path),
      external_id: card.external_id,
      headline: card.title,
      raw_text: card.title,
      published_at: null,
      language: "ru",
      ingestion_status: "normalized",
    });
  }

  async healthCheck(): Promise<AdapterHealth> {
    return {
      ok: true,
      live_collection: true,
      source_id: this.source_id,
      checked_at: new Date().toISOString(),
      details:
        "CTS public HTML collector is configured. Listing dates have day+month only, so year remains unknown until confirmed by a detail page.",
    };
  }
}
