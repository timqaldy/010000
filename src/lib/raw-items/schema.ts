import { z } from "zod";
import { INGESTION_STATUSES } from "./types";

const httpUrl = z.string().min(1).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "source_url must be a valid http(s) URL");

const isoDateTime = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "must be an ISO datetime");

export const rawItemSchema = z
  .object({
    id: z.string().min(1),
    source_id: z.string().min(1),
    source_url: httpUrl,
    external_id: z.string().min(1).nullable(),
    headline: z.string().min(1).nullable(),
    raw_text: z.string().min(1).nullable(),
    published_at: isoDateTime.nullable(),
    retrieved_at: isoDateTime,
    content_hash: z.string().regex(/^[a-f0-9]{64}$/, "content_hash must be sha256 hex"),
    language: z.string().min(2).max(16).nullable(),
    ingestion_status: z.enum(INGESTION_STATUSES),
    error: z.string().min(1).nullable(),
  })
  .superRefine((item, ctx) => {
    if (item.ingestion_status === "failed" && !item.error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["error"],
        message: "failed RawItem must include an error",
      });
    }
    if (item.headline === null && item.raw_text === null && item.ingestion_status !== "failed") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["headline"],
        message: "RawItem needs headline or raw_text unless failed",
      });
    }
  });
