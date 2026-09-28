import { createRawItem, type RawItem } from "@/lib/raw-items";
import { assertSourceMayIngest } from "../registry-gate";
import { stripTags } from "../sanitize";
import type { AdapterHealth, SourceAdapter } from "../types";
import { AdapterBlockedError, AdapterError } from "../errors";
import { parseGovKzNewsPayload } from "./news-schema";

export function buildGovKzEntityNewsUrl(entity: string, id: string | number): string {
  return `https://www.gov.kz/memleket/entities/${entity}/press/news/details/${id}`;
}

export class GovKzEntityAdapter implements SourceAdapter {
  constructor(
    readonly source_id: string,
    private readonly entity: string,
    private readonly label: string,
  ) {}

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
    const item = parseGovKzNewsPayload([record])[0];
    if (!item) throw new AdapterError(`${this.label} received an item outside the observed gov.kz schema`);
    const headline = stripTags(item.title);
    const summary = stripTags(item.short_description ?? "");
    const publishedAt = item.publication_date && !Number.isNaN(Date.parse(item.publication_date))
      ? new Date(item.publication_date).toISOString()
      : null;

    return createRawItem({
      source_id: this.source_id,
      source_url: buildGovKzEntityNewsUrl(this.entity, item.id),
      external_id: String(item.id),
      headline,
      raw_text: summary || headline,
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
      details: "gov.kz is a JS shell and its news API is ticket-gated. Live collection remains blocked; fixture/manual payload ingestion is available.",
    };
  }

  private liveFetchBlocker(operation: string): AdapterBlockedError {
    return new AdapterBlockedError(
      `${this.label} ${operation} is blocked by the gov.kz browser-ticket control. No evasion; use fixture/manual payloads.`,
    );
  }
}

export class AstanaDchsAdapter extends GovKzEntityAdapter {
  constructor() {
    super("astana-dchs", "emer-astana", "Astana DChS");
  }
}

export class AstanaTransportAdapter extends GovKzEntityAdapter {
  constructor() {
    super("astana-transport", "astana-uad", "Astana Transport Department");
  }
}
