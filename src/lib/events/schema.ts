import { z } from "zod";
import {
  EVENT_CATEGORIES,
  EVENT_LIFECYCLES,
  EVENT_SOURCE_ROLES,
} from "./types";

const isoDateTime = z.string().datetime({ offset: true });
const httpUrl = z.string().url().refine((value) => /^https?:\/\//.test(value), "must be http(s)");

export const eventLocationSchema = z.object({
  label: z.string().min(1),
  district: z.string().min(1).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
}).superRefine((location, ctx) => {
  if ((location.latitude === null) !== (location.longitude === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "latitude and longitude must both be present or both be null",
    });
  }
});

export const cityEventSchema = z.object({
  id: z.string().regex(/^ev_[a-f0-9]{16}$/),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(EVENT_CATEGORIES),
  title: z.string().min(5).max(180),
  summary: z.string().min(10).max(500),
  lifecycle: z.enum(EVENT_LIFECYCLES),
  location: eventLocationSchema.nullable(),
  starts_at: isoDateTime.nullable(),
  ends_at: isoDateTime.nullable(),
  detected_at: isoDateTime,
  updated_at: isoDateTime,
  confidence: z.number().min(0).max(1),
  importance: z.number().min(0).max(1),
  safety: z.enum(["PASS", "FAIL", "REVIEW"]),
  published_at: isoDateTime.nullable(),
  source_count: z.number().int().min(1),
  claims: z.array(z.string().min(1)).min(1),
  data_mode: z.enum(["fixture", "live"]),
}).superRefine((event, ctx) => {
  if (event.starts_at && event.ends_at && Date.parse(event.ends_at) < Date.parse(event.starts_at)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["ends_at"], message: "ends_at precedes starts_at" });
  }
  if (event.published_at && event.safety !== "PASS") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["published_at"], message: "published Event must pass safety" });
  }
});

export const eventSourceSchema = z.object({
  id: z.string().regex(/^es_[a-f0-9]{16}$/),
  event_id: z.string().regex(/^ev_[a-f0-9]{16}$/),
  raw_item_id: z.string().min(1),
  source_id: z.string().min(1),
  source_name: z.string().min(1),
  source_url: httpUrl,
  role: z.enum(EVENT_SOURCE_ROLES),
  independent: z.boolean(),
  observed_at: isoDateTime,
});

export const eventRevisionSchema = z.object({
  id: z.string().regex(/^er_[a-f0-9]{16}$/),
  event_id: z.string().regex(/^ev_[a-f0-9]{16}$/),
  created_at: isoDateTime,
  reason: z.string().min(1),
  changed_fields: z.array(z.string().min(1)).min(1),
  snapshot: cityEventSchema,
});
