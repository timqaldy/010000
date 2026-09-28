import { z } from "zod";
import {
  COMMERCIAL_USE_STATUSES,
  FETCH_METHODS,
  REUSE_STATUSES,
  ROBOTS_STATUSES,
} from "./types";

const httpUrl = z
  .string()
  .min(1)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "canonical_url must be a valid http(s) URL");

export const sourceRecordSchema = z
  .object({
    source_id: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "source_id must be kebab-case"),
    name: z.string().min(1),
    canonical_url: httpUrl,
    category: z.string().min(1),
    owner: z.string().min(1),
    official: z.boolean(),
    fetch_method: z.enum(FETCH_METHODS),
    priority: z.number().int().min(1).max(100),
    enabled: z.boolean(),
    robots_status: z.enum(ROBOTS_STATUSES),
    terms_url: httpUrl.nullable(),
    reuse_status: z.enum(REUSE_STATUSES),
    allowed_fields: z.array(z.string().min(1)),
    fulltext_storage_allowed: z.boolean(),
    image_reuse_allowed: z.boolean(),
    commercial_use_status: z.enum(COMMERCIAL_USE_STATUSES),
    attribution_required: z.boolean(),
    fetch_interval_minutes: z.number().int().min(0),
    confidence_weight: z.number().min(0).max(1),
    last_reviewed_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "last_reviewed_at must be YYYY-MM-DD")
      .nullable(),
    notes: z.string(),
  })
  .superRefine((source, ctx) => {
    if (source.reuse_status === "PROHIBITED" && source.enabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["enabled"],
        message: `Source ${source.source_id} is PROHIBITED and cannot be enabled`,
      });
    }
  });

export const sourceRegistrySchema = z
  .array(sourceRecordSchema)
  .superRefine((sources, ctx) => {
    const seen = new Set<string>();
    sources.forEach((source, index) => {
      if (seen.has(source.source_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, "source_id"],
          message: `Duplicate source_id: ${source.source_id}`,
        });
      }
      seen.add(source.source_id);
    });
  });
