import { sourceRecordSchema, sourceRegistrySchema } from "./schema";
import type { SourceRecord } from "./types";

export class SourceRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceRegistryError";
  }
}

export function assertHttpUrl(value: string, field = "canonical_url"): void {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
  } catch {
    throw new SourceRegistryError(`${field} is not a valid http(s) URL: ${value}`);
  }
}

export function assertSourceInvariants(source: SourceRecord): void {
  const parsed = sourceRecordSchema.safeParse(source);
  if (!parsed.success) {
    throw new SourceRegistryError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
}

export function validateSourceRegistry(input: unknown): SourceRecord[] {
  const parsed = sourceRegistrySchema.safeParse(input);
  if (!parsed.success) {
    throw new SourceRegistryError(parsed.error.issues.map((issue) => issue.message).join("; "));
  }
  return parsed.data;
}

export function canEnable(source: Pick<SourceRecord, "reuse_status">): boolean {
  return source.reuse_status !== "PROHIBITED";
}

export function withEnabled(source: SourceRecord, enabled: boolean): SourceRecord {
  const next = { ...source, enabled };
  assertSourceInvariants(next);
  return next;
}
