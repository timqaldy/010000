import { loadSourceRegistry } from "@/lib/sources";
import { AdapterError } from "./errors";

export function assertSourceMayIngest(sourceId: string): void {
  const source = loadSourceRegistry().find((item) => item.source_id === sourceId);
  if (!source) {
    throw new AdapterError(`Source ${sourceId} is not in the registry`);
  }
  if (source.reuse_status === "PROHIBITED") {
    throw new AdapterError(`Source ${sourceId} is PROHIBITED`);
  }
  if (!source.enabled) {
    throw new AdapterError(`Source ${sourceId} is disabled`);
  }
}
