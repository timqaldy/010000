import { createRawItem } from "@/lib/raw-items";
import type { RawItem } from "@/lib/raw-items";
import { AdapterError } from "../errors";
import { assertSourceMayIngest } from "../registry-gate";
import type { AdapterHealth, SourceAdapter } from "../types";
import { fetchPublicHtml, type FetchLike } from "../http";
import { parseAstanaRekHtml, type AstanaRekCard } from "./parse";

export const ASTANA_REK_SOURCE_ID = "astana-rek";

function toPublishedAt(dateOnly: string | null): string | null {
  if (!dateOnly) {
    return null;
  }
  return `${dateOnly}T00:00:00.000Z`;
}

export class AstanaRekAdapter implements SourceAdapter {
  readonly source_id = ASTANA_REK_SOURCE_ID;

  constructor(private readonly fetchImpl?: FetchLike) {}

  async discover(): Promise<unknown[]> {
    return this.parse(await this.fetch());
  }

  async fetch(): Promise<unknown> {
    return fetchPublicHtml({ url: "https://astrec.kz/news", sourceId: this.source_id, fetchImpl: this.fetchImpl });
  }

  parse(payload: unknown): unknown[] {
    if (typeof payload !== "string") {
      throw new AdapterError("Astana-REK adapter parse() expects HTML");
    }
    return parseAstanaRekHtml(payload);
  }

  normalize(record: unknown): RawItem {
    assertSourceMayIngest(this.source_id);
    const card = record as AstanaRekCard;
    if (!card?.title || !card.source_url) {
      throw new AdapterError("Astana-REK adapter received an incomplete card");
    }

    return createRawItem({
      source_id: this.source_id,
      source_url: card.source_url,
      external_id: card.external_id,
      headline: card.title,
      raw_text: card.summary,
      published_at: toPublishedAt(card.published_on),
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
        "Astana-REK public HTML collector is configured. Outage pages remain one lead item; address lists are not stored.",
    };
  }
}
