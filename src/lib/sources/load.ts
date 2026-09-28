import registryJson from "../../../data/sources.json";
import type { SourceRecord } from "./types";
import { validateSourceRegistry } from "./validate";

export function loadSourceRegistry(): SourceRecord[] {
  return validateSourceRegistry(registryJson);
}

export function getSourceById(sourceId: string): SourceRecord | undefined {
  return loadSourceRegistry().find((source) => source.source_id === sourceId);
}
