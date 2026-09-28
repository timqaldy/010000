import { createHash } from "node:crypto";

export function canonicalizeUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  if ((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443")) {
    url.port = "";
  }
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`;
}

export function normalizeEvidenceText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function computeContentHash(headline: string | null | undefined, rawText: string | null | undefined): string {
  const payload = `${normalizeEvidenceText(headline)}\n${normalizeEvidenceText(rawText)}`;
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

export function computeRawItemId(sourceId: string, sourceUrl: string, contentHash: string): string {
  const payload = `${sourceId}\n${canonicalizeUrl(sourceUrl)}\n${contentHash}`;
  return `ri_${createHash("sha256").update(payload, "utf8").digest("hex").slice(0, 24)}`;
}
