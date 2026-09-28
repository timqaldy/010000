import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  REUSE_STATUSES,
  SourceRegistryError,
  assertHttpUrl,
  canEnable,
  loadSourceRegistry,
  validateSourceRegistry,
  withEnabled,
} from "@/lib/sources";
import type { SourceRecord } from "@/lib/sources";

const registryPath = resolve(process.cwd(), "data/sources.json");

function rawRegistry(): unknown {
  return JSON.parse(readFileSync(registryPath, "utf8"));
}

function cloneSource(sourceId: string): SourceRecord {
  const source = loadSourceRegistry().find((item) => item.source_id === sourceId);
  if (!source) {
    throw new Error(`Missing seed source: ${sourceId}`);
  }
  return { ...source, allowed_fields: [...source.allowed_fields] };
}

describe("Source Registry", () => {
  it("loads exactly 20 unique seed sources", () => {
    const sources = loadSourceRegistry();
    const ids = sources.map((source) => source.source_id);

    expect(sources).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
  });

  it("rejects duplicate source IDs", () => {
    const sources = loadSourceRegistry();
    const duplicated = [sources[0], ...sources];

    expect(() => validateSourceRegistry(duplicated)).toThrowError(/Duplicate source_id/);
  });

  it("requires valid http(s) canonical URLs", () => {
    const sources = loadSourceRegistry();

    for (const source of sources) {
      expect(() => assertHttpUrl(source.canonical_url)).not.toThrow();
    }

    const invalid = {
      ...cloneSource("astana-akimat"),
      canonical_url: "not-a-url",
    };

    expect(() => validateSourceRegistry([invalid])).toThrowError(/valid http/);
    expect(() => assertHttpUrl("ftp://example.com")).toThrow(SourceRegistryError);
  });

  it("allows only the reuse_status enum", () => {
    const sources = loadSourceRegistry();

    for (const source of sources) {
      expect(REUSE_STATUSES).toContain(source.reuse_status);
    }

    const invalid = {
      ...cloneSource("astana-akimat"),
      reuse_status: "PUBLIC_DOMAIN",
    };

    expect(() => validateSourceRegistry([invalid])).toThrow();
  });

  it("does not allow prohibited sources to be enabled", () => {
    const sources = loadSourceRegistry();
    const prohibited = sources.filter((source) => source.reuse_status === "PROHIBITED");

    expect(prohibited.map((source) => source.source_id).sort()).toEqual([
      "telegram",
      "twogis",
      "yandex-maps",
    ]);

    for (const source of prohibited) {
      expect(source.enabled).toBe(false);
      expect(canEnable(source)).toBe(false);
      expect(() => withEnabled(source, true)).toThrowError(/PROHIBITED and cannot be enabled/);
    }

    const raw = rawRegistry() as SourceRecord[];
    const forced = raw.map((source) =>
      source.source_id === "telegram" ? { ...source, enabled: true } : source,
    );

    expect(() => validateSourceRegistry(forced)).toThrowError(/cannot be enabled/);
  });

  it("keeps the required disabled seed records disabled", () => {
    const disabledIds = [
      "ikomek-109",
      "astana-su-arnasy",
      "astana-teplotransit",
      "qazaqjylu",
      "kazhydromet",
      "astana-airport",
      "visit-astana",
      "astana-hub",
      "data-egov",
      "stat-gov",
      "kazinform",
      "openstreetmap",
      "telegram",
      "yandex-maps",
      "twogis",
    ];

    const sources = loadSourceRegistry();
    for (const sourceId of disabledIds) {
      const source = sources.find((item) => item.source_id === sourceId);
      expect(source, sourceId).toBeDefined();
      expect(source?.enabled).toBe(false);
    }
  });
});
