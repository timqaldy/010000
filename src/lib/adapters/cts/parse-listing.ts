import { AdapterError } from "../errors";
import { stripTags } from "../sanitize";

export type CtsNewsCard = {
  external_id: string;
  title: string;
  path: string;
  day: string;
  month: string;
};

const CARD_PATTERN =
  /id="bx_[^"]+_(\d+)"[\s\S]*?main-news--date-d">\s*(\d+)\s*<[\s\S]*?main-news--date-my">\s*([^<]+)<[\s\S]*?main-news--title">\s*([^<]+)<[\s\S]*?href="([^"]+)"\s+class="main-news--link"/g;

export function parseCtsNewsListing(html: string): CtsNewsCard[] {
  if (!html.includes("main-news--title")) {
    throw new AdapterError("CTS listing HTML does not contain the observed news card markup");
  }

  const cards: CtsNewsCard[] = [];
  for (const match of html.matchAll(CARD_PATTERN)) {
    const title = stripTags(match[4] ?? "");
    const path = (match[5] ?? "").trim();
    if (!title || !path) {
      continue;
    }
    cards.push({
      external_id: match[1] ?? path,
      title,
      path,
      day: (match[2] ?? "").trim(),
      month: stripTags(match[3] ?? ""),
    });
  }
  return cards;
}

export function resolveCtsUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return new URL(path, "https://cts.gov.kz").toString();
}
