import { randomUUID } from "node:crypto";
import type { InsertRawItemResult, MemoryRawItemStore } from "../raw-items/store";
import { createAdapter } from "./adapters";

export type IngestRunStatus = "ok" | "partial" | "failed";

export type IngestRunError = {
  message: string;
};

export type IngestRunResult = {
  run_id: string;
  source_id: string;
  started_at: string;
  finished_at: string;
  status: IngestRunStatus;
  items_discovered: number;
  items_created: number;
  items_skipped: number;
  errors: IngestRunError[];
  results: InsertRawItemResult[];
};

export function ingestPayload(input: {
  sourceId: string;
  payload: unknown;
  store: MemoryRawItemStore;
}): IngestRunResult {
  const startedAt = new Date().toISOString();
  const runId = `run_${randomUUID()}`;
  const errors: IngestRunError[] = [];
  const results: InsertRawItemResult[] = [];

  try {
    const adapter = createAdapter(input.sourceId);
    const parsed = adapter.parse(input.payload);

    for (const record of parsed) {
      try {
        results.push(input.store.insert(adapter.normalize(record)));
      } catch (error) {
        errors.push({ message: error instanceof Error ? error.message : String(error) });
      }
    }

    const created = results.filter((result) => result.kind === "created").length;
    const skipped = results.filter((result) => result.kind === "duplicate").length;
    const status: IngestRunStatus =
      parsed.length === 0 && errors.length === 0
        ? "ok"
        : errors.length === 0
          ? "ok"
          : created + skipped > 0
            ? "partial"
            : "failed";

    return {
      run_id: runId,
      source_id: input.sourceId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      items_discovered: parsed.length,
      items_created: created,
      items_skipped: skipped,
      errors,
      results,
    };
  } catch (error) {
    return {
      run_id: runId,
      source_id: input.sourceId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: "failed",
      items_discovered: 0,
      items_created: 0,
      items_skipped: 0,
      errors: [{ message: error instanceof Error ? error.message : String(error) }],
      results,
    };
  }
}
