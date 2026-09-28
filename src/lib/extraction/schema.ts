import { z } from "zod";
import { EVENT_CATEGORIES, eventLocationSchema } from "@/lib/events";

export const eventCandidateSchema = z.object({
  category: z.enum(EVENT_CATEGORIES),
  title: z.string().min(5).max(180),
  summary: z.string().min(10).max(500),
  location: eventLocationSchema.nullable(),
  starts_at: z.string().datetime({ offset: true }).nullable(),
  ends_at: z.string().datetime({ offset: true }).nullable(),
  claims: z.array(z.string().min(1)).min(1),
}).superRefine((candidate, ctx) => {
  if (candidate.starts_at && candidate.ends_at && Date.parse(candidate.ends_at) < Date.parse(candidate.starts_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ends_at"], message: "ends_at precedes starts_at" });
  }
});

export const extractionRunSchema = z.object({
  id: z.string().min(1),
  raw_item_id: z.string().min(1),
  provider: z.enum(["deterministic", "ai"]),
  model: z.string().min(1),
  prompt_version: z.string().min(1),
  schema_version: z.string().min(1),
  started_at: z.string().datetime({ offset: true }),
  finished_at: z.string().datetime({ offset: true }),
  latency_ms: z.number().nonnegative(),
  input_tokens: z.number().int().nonnegative().nullable(),
  output_tokens: z.number().int().nonnegative().nullable(),
  cost_usd: z.number().nonnegative().nullable(),
  status: z.enum(["ok", "failed"]),
  error: z.string().min(1).nullable(),
});
