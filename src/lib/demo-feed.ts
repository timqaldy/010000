import type { EventRecord } from "@/lib/events";
import { processRawItems } from "@/lib/pipeline";
import { createRawItem } from "@/lib/raw-items";
import { loadSourceRegistry } from "@/lib/sources";

const rawItems = [
  createRawItem({
    source_id: "astana-akimat",
    source_url: "https://www.gov.kz/memleket/entities/astana/press/news/details/1245600",
    external_id: "1245600",
    headline: "Ремонт транспортной развязки на пересечении Мәңгілік Ел и Сыганак",
    raw_text: "С 23 по 24 июня 2026 года будет перекрыто движение на съездах развязки проспекта Мәңгілік Ел и улицы Сыганак.",
    published_at: "2026-06-22T09:00:00.000Z",
    retrieved_at: "2026-06-22T09:05:00.000Z",
    language: "ru",
    ingestion_status: "normalized",
  }),
  createRawItem({
    source_id: "cts",
    source_url: "https://cts.gov.kz/ru/press-center/news/izmenen-poryadok-ostanovki-obshchestvennogo-transporta-na-ostanovochnykh-punktakh-bts-the-square-i-b/",
    external_id: "3548",
    headline: "Изменен порядок остановки транспорта у БЦ The Square и Барыс Арены",
    raw_text: "Изменен порядок остановки общественного транспорта на остановочных пунктах БЦ The Square и Барыс Арена.",
    published_at: null,
    retrieved_at: "2026-07-17T08:00:00.000Z",
    language: "ru",
    ingestion_status: "normalized",
  }),
  createRawItem({
    source_id: "cts",
    source_url: "https://cts.gov.kz/ru/press-center/news/dvizhenie-tarlan-astana-vosstanovleno/",
    external_id: "3547",
    headline: "Движение Tarlan Astana восстановлено",
    raw_text: "CTS сообщает о восстановлении движения Tarlan Astana.",
    published_at: null,
    retrieved_at: "2026-07-02T08:00:00.000Z",
    language: "ru",
    ingestion_status: "normalized",
  }),
  createRawItem({
    source_id: "astana-rek",
    source_url: "https://astrec.kz/news/natsionalnyi-proekt-2026-rekonstruktsiia-raspredelitelnyh-setei-20-10-04-kv-v-ramkah-realizatsii-natsionalnogo-proekta",
    headline: "Реконструкция распределительных сетей 20–10–0,4 кВ",
    raw_text: "Астана-РЭК сообщает о реконструкции распределительных электрических сетей в рамках национального проекта 2026 года.",
    published_at: "2026-07-19T00:00:00.000Z",
    retrieved_at: "2026-07-19T06:00:00.000Z",
    language: "ru",
    ingestion_status: "normalized",
  }),
  createRawItem({
    source_id: "astana-rek",
    source_url: "https://astrec.kz/news/v-raione-saryarka-prodolzhaetsia-remontnaia-kampaniia-2026-goda",
    headline: "В районе Сарыарка продолжается ремонтная кампания",
    raw_text: "Астана-РЭК сообщает о продолжении ремонтной кампании 2026 года в районе Сарыарка.",
    published_at: "2026-07-09T00:00:00.000Z",
    retrieved_at: "2026-07-09T06:00:00.000Z",
    language: "ru",
    ingestion_status: "normalized",
  }),
  createRawItem({
    source_id: "astana-rek",
    source_url: "https://astrec.kz/ru/planovye-otkljuchenija",
    external_id: "planned-outages",
    headline: "Плановые отключения электроэнергии",
    raw_text: "Астана-РЭК сообщает о плановом прекращении подачи электрической энергии 11 сентября 2026 года в районе Сарыарка.",
    published_at: "2026-09-11T00:00:00.000Z",
    retrieved_at: "2026-09-11T05:00:00.000Z",
    language: "ru",
    ingestion_status: "normalized",
  }),
];

const result = processRawItems(rawItems, loadSourceRegistry(), "fixture");

export function getDemoEventRecords(): EventRecord[] {
  return [...result.records]
    .filter((record) => record.event.published_at !== null)
    .sort((a, b) => Date.parse(b.event.updated_at) - Date.parse(a.event.updated_at));
}

export function getDemoEventRecord(idOrSlug: string): EventRecord | undefined {
  return getDemoEventRecords().find(({ event }) => event.id === idOrSlug || event.slug === idOrSlug);
}

export function getDemoPipelineMetrics() {
  return {
    raw_items: rawItems.length,
    events: result.records.length,
    published: getDemoEventRecords().length,
    rejected: result.rejected.length,
    extraction_runs: result.extraction_runs.length,
    extraction_provider: "deterministic rules (AI provider not configured)",
  };
}
