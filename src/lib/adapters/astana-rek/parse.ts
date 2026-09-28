import { AdapterError } from "../errors";
import { stripTags } from "../sanitize";

export const ASTREC_OUTAGE_URL =
  "https://astrec.kz/ofitsialnaia-informatsiia/avariinye-planovye-otkliucheniia-elektroenergii";

export type AstanaRekCard = {
  kind: "news" | "outage";
  external_id: string;
  title: string;
  source_url: string;
  published_on: string | null;
  summary: string;
};

const NEWS_CARD_PATTERN =
  /<a href="(https:\/\/astrec\.kz\/news\/[^"]+)" class="news-item_title[^"]*">([^<]+)<[\s\S]*?datetime="(\d{4}-\d{2}-\d{2})"/g;

export function parseAstanaRekHtml(html: string): AstanaRekCard[] {
  if (html.includes("news-item_title")) {
    return parseNewsListing(html);
  }
  if (html.includes("heading-1") && html.includes("editor-content")) {
    return [parseOutageBulletin(html)];
  }
  throw new AdapterError("Astana-REK HTML does not match the observed news listing or outage bulletin markup");
}

function parseNewsListing(html: string): AstanaRekCard[] {
  const cards: AstanaRekCard[] = [];
  for (const match of html.matchAll(NEWS_CARD_PATTERN)) {
    const sourceUrl = match[1] ?? "";
    const title = stripTags(match[2] ?? "");
    const publishedOn = match[3] ?? null;
    if (!sourceUrl || !title) {
      continue;
    }
    cards.push({
      kind: "news",
      external_id: slugFromUrl(sourceUrl),
      title,
      source_url: sourceUrl,
      published_on: publishedOn,
      summary: title,
    });
  }
  return cards;
}

function parseOutageBulletin(html: string): AstanaRekCard {
  const heading = html.match(/<h1 class="heading-1">([^<]+)<\/h1>/);
  const title = stripTags(heading?.[1] ?? "");
  if (!title) {
    throw new AdapterError("Astana-REK outage page is missing the observed h1");
  }

  const editor = html.match(/<div class="editor-content[^"]*">([\s\S]*?)<\/div>/);
  const strongParagraphs = [...(editor?.[1]?.matchAll(/<p>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>/g) ?? [])];
  const summary =
    strongParagraphs.map((match) => stripTags(match[1] ?? "")).find((text) => text.length > 0) ?? title;

  return {
    kind: "outage",
    external_id: "avariinye-planovye-otkliucheniia-elektroenergii",
    title,
    source_url: ASTREC_OUTAGE_URL,
    published_on: null,
    summary,
  };
}

function slugFromUrl(url: string): string {
  const path = new URL(url).pathname.replace(/\/+$/, "");
  return path.split("/").filter(Boolean).at(-1) ?? url;
}
