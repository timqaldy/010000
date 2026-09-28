import { createAdapter } from "@/lib/ingest/adapters";
import type { SourceRecord } from "@/lib/sources";

export type SourceHealth = {
  source_id: string;
  checked_at: string;
  adapter_ready: boolean;
  live_collection: "available" | "blocked" | "not_implemented";
  details: string;
};

export async function checkSourceHealth(registry: readonly SourceRecord[]): Promise<SourceHealth[]> {
  const enabled = registry.filter((source) => source.enabled);
  return Promise.all(enabled.map(async (source) => {
    try {
      const adapter = createAdapter(source.source_id);
      const health = await adapter.healthCheck();
      return {
        source_id: source.source_id,
        checked_at: health.checked_at,
        adapter_ready: true,
        live_collection: health.live_collection ? "available" as const : "blocked" as const,
        details: health.details,
      };
    } catch (error) {
      return {
        source_id: source.source_id,
        checked_at: new Date().toISOString(),
        adapter_ready: false,
        live_collection: "not_implemented" as const,
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }));
}
