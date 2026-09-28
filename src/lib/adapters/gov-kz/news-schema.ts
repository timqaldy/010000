import { z } from "zod";

export const govKzNewsItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string().min(1),
  short_description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  publication_date: z.string().optional().nullable(),
  updated_date: z.string().optional().nullable(),
  projects: z.string().optional().nullable(),
  alias: z.string().optional().nullable(),
});

export type GovKzNewsItem = z.infer<typeof govKzNewsItemSchema>;

export function parseGovKzNewsPayload(payload: unknown): GovKzNewsItem[] {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "items" in payload
      ? (payload as { items: unknown }).items
      : payload && typeof payload === "object" && "data" in payload
        ? (payload as { data: unknown }).data
        : [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list.flatMap((item) => {
    const parsed = govKzNewsItemSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
