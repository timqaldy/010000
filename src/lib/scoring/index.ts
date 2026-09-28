import type { EventCategory, EventSource } from "@/lib/events";
import type { SourceRecord } from "@/lib/sources";

function round(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
}

export function scoreConfidence(
  evidence: readonly EventSource[],
  registry: readonly SourceRecord[],
): number {
  const unique = [...new Set(evidence.filter((item) => item.independent).map((item) => item.source_id))];
  const weights = unique.map((id) => registry.find((source) => source.source_id === id)?.confidence_weight ?? 0);
  const strongest = Math.max(0, ...weights);
  const confirmationBonus = Math.min(0.2, Math.max(0, unique.length - 1) * 0.12);
  const contradictionPenalty = evidence.some((item) => item.role === "CONTRADICTING") ? 0.3 : 0;
  return round(strongest * 0.8 + confirmationBonus - contradictionPenalty);
}

const CATEGORY_BASE: Record<EventCategory, number> = {
  EMERGENCY: 0.75,
  UTILITIES: 0.42,
  TRAFFIC: 0.48,
  TRANSPORT: 0.38,
  CITY: 0.25,
};

const ACTIONABLE = /перекры|закрыт|огранич|отключ|авари|пожар|восстанов|измен[её]н|ремонт|предупреждени|угроз|задерж|приостанов/i;
const ROUTINE = /юбиле|поздрав|состоял|ваканси|конкурс|программ[аы].*капитальн|итог[иов]|торжествен/i;

export function scoreImportance(input: {
  category: EventCategory;
  hasLocation: boolean;
  active: boolean;
  citywide?: boolean;
  text?: string;
}): number {
  const text = input.text ?? "";
  return round(
    CATEGORY_BASE[input.category]
      + (input.hasLocation ? 0.05 : 0)
      + (input.active ? 0.03 : 0)
      + (input.citywide ? 0.08 : 0)
      + (ACTIONABLE.test(text) ? 0.2 : 0)
      - (ROUTINE.test(text) ? 0.3 : 0),
  );
}
