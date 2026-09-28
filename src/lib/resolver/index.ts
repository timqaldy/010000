import { PRODUCT_CONFIG } from "@/lib/config";
import type { CityEvent } from "@/lib/events";
import type { EventCandidate } from "@/lib/extraction";

export type ResolutionDecision =
  | { kind: "new"; reason: string }
  | { kind: "match"; event: CityEvent; score: number; reason: string };

function tokens(value: string): Set<string> {
  return new Set(
    value.toLocaleLowerCase("ru").match(/[\p{L}\p{N}]{3,}/gu) ?? [],
  );
}

export function tokenSimilarity(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  let intersection = 0;
  a.forEach((token) => {
    if (b.has(token)) intersection += 1;
  });
  return intersection / union.size;
}

function hoursApart(a: string | null, b: string | null): number {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.abs(Date.parse(a) - Date.parse(b)) / 3_600_000;
}

export function resolveEventCandidate(
  candidate: EventCandidate,
  events: readonly CityEvent[],
): ResolutionDecision {
  const eligible = events.filter((event) => {
    if (event.category !== candidate.category) return false;
    const sameLocation = event.location?.label && candidate.location?.label
      ? event.location.label === candidate.location.label
      : true;
    const closeInTime = hoursApart(event.starts_at, candidate.starts_at) <= PRODUCT_CONFIG.resolver.maximumHoursApart;
    return sameLocation && (closeInTime || !event.starts_at || !candidate.starts_at);
  });

  const ranked = eligible
    .map((event) => ({ event, score: tokenSimilarity(`${event.title} ${event.summary}`, `${candidate.title} ${candidate.summary}`) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];

  if (best && best.score >= PRODUCT_CONFIG.resolver.minimumTokenSimilarity) {
    return { kind: "match", ...best, reason: "category, time/location filters, and token similarity" };
  }
  return { kind: "new", reason: eligible.length ? "similarity below threshold" : "no deterministic candidate" };
}
