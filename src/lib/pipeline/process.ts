import { createHash } from "node:crypto";
import type { CityEvent, DataMode, EventRecord, EventRevision, EventSource } from "@/lib/events";
import { cityEventSchema, eventRevisionSchema, eventSourceSchema } from "@/lib/events";
import { AiExtractionError, configuredOpenAIExtractor, extractEventCandidate, type EventCandidate, type ExtractionResult, type ExtractionRun } from "@/lib/extraction";
import { evaluatePublication } from "@/lib/publication";
import type { RawItem } from "@/lib/raw-items";
import { resolveEventCandidate } from "@/lib/resolver";
import { evaluateSafety } from "@/lib/safety";
import { scoreConfidence, scoreImportance } from "@/lib/scoring";
import type { SourceRecord } from "@/lib/sources";

export type PipelineResult = {
  records: EventRecord[];
  extraction_runs: ExtractionRun[];
  rejected: Array<{ raw_item_id: string; reason: string }>;
};

function digest(prefix: string, value: string): string {
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

function inferredLifecycle(candidate: EventCandidate): CityEvent["lifecycle"] {
  return /восстановлен|возобновлен|заверш[её]н|устран[её]н/i.test(`${candidate.title} ${candidate.summary}`)
    ? "RESOLVED"
    : "CONFIRMED";
}

function createEvidence(raw: RawItem, eventId: string, registry: readonly SourceRecord[], role: EventSource["role"]): EventSource {
  const source = registry.find((entry) => entry.source_id === raw.source_id);
  return eventSourceSchema.parse({
    id: digest("es", `${eventId}:${raw.id}`),
    event_id: eventId,
    raw_item_id: raw.id,
    source_id: raw.source_id,
    source_name: source?.name ?? raw.source_id,
    source_url: raw.source_url,
    role,
    independent: true,
    observed_at: raw.retrieved_at,
  });
}

function finalize(event: CityEvent, evidence: EventSource[], registry: readonly SourceRecord[]): CityEvent {
  const candidate = {
    category: event.category,
    title: event.title,
    summary: event.summary,
    location: event.location,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    claims: event.claims,
  };
  const safety = evaluateSafety({ candidate, evidence, registry }).outcome;
  const next = cityEventSchema.parse({
    ...event,
    source_count: new Set(evidence.map((item) => item.source_id)).size,
    confidence: scoreConfidence(evidence, registry),
    importance: scoreImportance({
      category: event.category,
      hasLocation: event.location !== null,
      active: ["CONFIRMED", "ACTIVE", "UPDATED"].includes(event.lifecycle),
      text: `${event.title} ${event.summary}`,
    }),
    safety,
  });
  const publication = evaluatePublication(next);
  return cityEventSchema.parse({
    ...next,
    published_at: publication.eligible ? next.published_at ?? next.updated_at : null,
  });
}

function createRecord(raw: RawItem, extraction: EventCandidate, registry: readonly SourceRecord[], mode: DataMode): EventRecord {
  const eventId = digest("ev", `${extraction.category}:${extraction.title}:${extraction.location?.label ?? ""}:${extraction.starts_at ?? ""}`);
  const detectedAt = raw.retrieved_at;
  const base = cityEventSchema.parse({
    id: eventId,
    slug: `${extraction.category.toLowerCase()}-${eventId.slice(-8)}`,
    ...extraction,
    lifecycle: inferredLifecycle(extraction),
    detected_at: detectedAt,
    updated_at: detectedAt,
    confidence: 0,
    importance: 0,
    safety: "REVIEW",
    published_at: null,
    source_count: 1,
    data_mode: mode,
  });
  const sources = [createEvidence(raw, eventId, registry, "PRIMARY")];
  return { event: finalize(base, sources, registry), sources, revisions: [] };
}

function mergeRecord(record: EventRecord, raw: RawItem, candidate: EventCandidate, registry: readonly SourceRecord[]): EventRecord {
  const previous = structuredClone(record.event);
  const duplicateSource = record.sources.some((source) => source.raw_item_id === raw.id);
  if (duplicateSource) return record;
  const nextLifecycle = inferredLifecycle(candidate);
  const sources = [...record.sources, createEvidence(raw, record.event.id, registry, nextLifecycle === "RESOLVED" ? "UPDATE" : "CONFIRMING")];
  const merged = finalize(cityEventSchema.parse({
    ...record.event,
    lifecycle: nextLifecycle === "RESOLVED" ? "RESOLVED" : "UPDATED",
    updated_at: raw.retrieved_at,
  }), sources, registry);
  const revision: EventRevision = eventRevisionSchema.parse({
    id: digest("er", `${record.event.id}:${raw.id}`),
    event_id: record.event.id,
    created_at: raw.retrieved_at,
    reason: "New confirming evidence attached",
    changed_fields: ["lifecycle", "updated_at", "confidence", "source_count"],
    snapshot: previous,
  });
  return { event: merged, sources, revisions: [...record.revisions, revision] };
}

export function processRawItems(
  rawItems: readonly RawItem[],
  registry: readonly SourceRecord[],
  mode: DataMode = "live",
  initialRecords: readonly EventRecord[] = [],
): PipelineResult {
  const extracted: Array<{ raw: RawItem; extraction: ExtractionResult }> = [];
  const extractionRuns: ExtractionRun[] = [];
  const rejected: PipelineResult["rejected"] = [];

  for (const raw of rawItems) {
    try {
      const extraction = extractEventCandidate(raw);
      extractionRuns.push(extraction.run);
      extracted.push({ raw, extraction });
    } catch (error) {
      rejected.push({ raw_item_id: raw.id, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  const records = processExtractions(extracted, registry, mode, initialRecords);
  return { records, extraction_runs: extractionRuns, rejected };
}

export async function processRawItemsConfigured(
  rawItems: readonly RawItem[],
  registry: readonly SourceRecord[],
  mode: DataMode = "live",
  initialRecords: readonly EventRecord[] = [],
): Promise<PipelineResult> {
  const ai = configuredOpenAIExtractor();
  if (!ai) return processRawItems(rawItems, registry, mode, initialRecords);
  const extracted: Array<{ raw: RawItem; extraction: ExtractionResult }> = [];
  const extractionRuns: ExtractionRun[] = [];
  const rejected: PipelineResult["rejected"] = [];
  for (const raw of rawItems) {
    try {
      const extraction = await ai.extract(raw);
      extractionRuns.push(extraction.run);
      extracted.push({ raw, extraction });
    } catch (error) {
      if (error instanceof AiExtractionError) extractionRuns.push(error.run);
      rejected.push({ raw_item_id: raw.id, reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return { records: processExtractions(extracted, registry, mode, initialRecords), extraction_runs: extractionRuns, rejected };
}

function processExtractions(
  extracted: Array<{ raw: RawItem; extraction: ExtractionResult }>,
  registry: readonly SourceRecord[],
  mode: DataMode,
  initialRecords: readonly EventRecord[],
): EventRecord[] {
  const records = structuredClone(initialRecords) as EventRecord[];
  for (const { raw, extraction } of extracted) {
    const decision = resolveEventCandidate(extraction.candidate, records.map((record) => record.event));
    if (decision.kind === "match") {
      const index = records.findIndex((record) => record.event.id === decision.event.id);
      records[index] = mergeRecord(records[index], raw, extraction.candidate, registry);
    } else {
      records.push(createRecord(raw, extraction.candidate, registry, mode));
    }
  }
  return records;
}
