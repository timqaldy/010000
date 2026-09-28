import { z } from "zod";
import { cityEventSchema, eventRevisionSchema, eventSourceSchema } from "@/lib/events";
import { extractionRunSchema } from "@/lib/extraction";
import { rawItemSchema } from "@/lib/raw-items";

const collectionSourceResultSchema = z.object({
  source_id: z.string().min(1),
  status: z.enum(["ok", "failed"]),
  discovered: z.number().int().nonnegative(),
  created: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  error: z.string().min(1).nullable(),
});

const collectionRunSchema = z.object({
  id: z.string().min(1),
  started_at: z.string().datetime({ offset: true }),
  finished_at: z.string().datetime({ offset: true }),
  status: z.enum(["ok", "partial", "failed"]),
  sources: z.array(collectionSourceResultSchema),
});

export const runtimeStateSchema = z.object({
  version: z.literal(1),
  pipeline_version: z.number().int().positive().default(1),
  updated_at: z.string().datetime({ offset: true }),
  raw_items: z.array(rawItemSchema),
  event_records: z.array(z.object({
    event: cityEventSchema,
    sources: z.array(eventSourceSchema),
    revisions: z.array(eventRevisionSchema),
  })),
  extraction_runs: z.array(extractionRunSchema),
  collection_runs: z.array(collectionRunSchema),
});
