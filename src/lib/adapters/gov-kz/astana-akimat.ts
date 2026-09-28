import { createRawItem } from "@/lib/raw-items";
import type { RawItem } from "@/lib/raw-items";
import { AdapterBlockedError, AdapterError } from "../errors";
import { assertSourceMayIngest } from "../registry-gate";
import { stripTags } from "../sanitize";
import type { AdapterHealth, SourceAdapter } from "../types";
import { parseGovKzNewsPayload } from "./news-schema";

export const ASTANA_AKIMAT_SOURCE_ID = "astana-akimat";
export const GOV_KZ_NEWS_API_PATH = "/api/v1/public/content-manager/news";

const PROJECT_SLUG = "astana";

export function buildGovKzNewsUrl(projectSlug: string, id: string | number): string {
  return `https://www.gov.kz/memleket/entities/${projectSlug}/press/news/details/${id}`;
}

export class AstanaAkimatAdapter implements SourceAdapter {
  readonly source_id = ASTANA_AKIMAT_SOURCE_ID;

  async discover(): Promise<unknown[]> {
    throw this.liveFetchBlocker("discover");
  }

  async fetch(): Promise<unknown> {
    throw this.liveFetchBlocker("fetch");
  }

  parse(payload: unknown): unknown[] {
    return parseGovKzNewsPayload(payload);
  }

  normalize(record: unknown): RawItem {
    assertSourceMayIngest(this.source_id);
    const items = parseGovKzNewsPayload([record]);
    const item = items[0];
    if (!item) {
      throw new AdapterError("Astana Akimat adapter received an item that does not match the observed gov.kz news schema");
    }

    const headline = stripTags(item.title);
    const summary = stripTags(item.short_description ?? "");
    const publishedAt = item.publication_date && !Number.isNaN(Date.parse(item.publication_date))
      ? new Date(item.publication_date).toISOString()
      : null;

    return createRawItem({
      source_id: this.source_id,
      source_url: buildGovKzNewsUrl(item.projects || PROJECT_SLUG, item.id),
      external_id: String(item.id),
      headline,
      raw_text: summary.length > 0 ? summary : headline,
      published_at: publishedAt,
      language: "ru",
      ingestion_status: "normalized",
    });
  }

  async healthCheck(): Promise<AdapterHealth> {
    return {
      ok: false,
      live_collection: false,
      source_id: this.source_id,
      checked_at: new Date().toISOString(),
      details:
        "gov.kz HTML is a JS shell. Public news API returns notAllowed without a browser ticket. Ticket flow is an anti-bot control and will not be implemented.",
    };
  }

  private liveFetchBlocker(operation: string): AdapterBlockedError {
    return new AdapterBlockedError(
      `Astana Akimat ${operation} is blocked: gov.kz content-manager news API requires a browser request ticket. No evasion. Use fixture/manual payloads with parse()+normalize().`,
    );
  }
}
