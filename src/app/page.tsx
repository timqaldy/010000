import Link from "next/link";
import type { CityEvent } from "@/lib/events";
import { getEventRecords } from "@/lib/runtime";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<CityEvent["category"], string> = {
  TRAFFIC: "Дороги",
  TRANSPORT: "Транспорт",
  EMERGENCY: "Безопасность",
  UTILITIES: "Городские сети",
  CITY: "Город",
};

const LIFECYCLE_LABELS: Partial<Record<CityEvent["lifecycle"], string>> = {
  CONFIRMED: "Подтверждено",
  ACTIVE: "Активно",
  UPDATED: "Обновлено",
  RESOLVED: "Завершено",
};

function formatDate(value: string | null): string {
  if (!value) return "Дата в источнике без года";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Almaty" }).format(new Date(value));
}

export default async function HomePage() {
  const feed = await getEventRecords();
  const records = feed.records;
  const latestUpdate = records.reduce<string | null>((latest, { event }) =>
    !latest || Date.parse(event.updated_at) > Date.parse(latest) ? event.updated_at : latest, null);

  return (
    <main className="site-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="010000 — главная">
          <span className="brand-mark">010000</span>
          <span className="brand-city">ASTANA / LIVE</span>
        </Link>
        <div className="status-cluster"><span className="pulse" aria-hidden="true" /><span>{feed.mode === "live" ? "LIVE COLLECTION" : "LOCAL PREVIEW"}</span></div>
      </header>

      <section className="hero">
        <p className="eyebrow">ГОРОДСКАЯ СИТУАЦИОННАЯ ЛЕНТА</p>
        <h1>Город говорит<br />сам за себя.</h1>
        <p className="hero-copy">Коротко о том, что меняется в Астане. Только факты, понятная география и ссылка на первоисточник.</p>
        <div className="hero-meta"><span>{records.length} событий в локальном наборе</span><span>Обновлено {formatDate(latestUpdate)}</span></div>
      </section>

      <aside className="demo-notice">
        <strong>{feed.mode === "live" ? "Автономный локальный режим." : "Демонстрационный режим."}</strong>
        <span>{feed.mode === "live" ? "Лента построена из сохранённых результатов разрешённого live-сбора CTS и Astana-REK. Gov.kz остаётся заблокированным." : "Лента собрана из зафиксированных тестовых материалов официальных источников. Первый live-сбор ещё не завершён."}</span>
        <Link href="/control">Состояние системы →</Link>
      </aside>

      <section className="feed" aria-labelledby="feed-title">
        <div className="section-head"><div><p className="eyebrow">ПОДТВЕРЖДЕННЫЕ ФАКТЫ</p><h2 id="feed-title">Последние события</h2></div><span className="section-count">{String(records.length).padStart(2, "0")}</span></div>
        <div className="event-list">
          {records.map(({ event }) => (
            <article className="event-card" key={event.id}>
              <div className="event-rail"><span className={`category-dot category-${event.category.toLowerCase()}`} /><span className="rail-line" /></div>
              <div className="event-content">
                <div className="event-meta"><span className="category-label">{CATEGORY_LABELS[event.category]}</span><time>{formatDate(event.starts_at)}</time><span>{LIFECYCLE_LABELS[event.lifecycle] ?? event.lifecycle}</span></div>
                <h3><Link href={`/event/${event.slug}`}>{event.title}</Link></h3>
                <p>{event.summary}</p>
                <div className="event-footer"><span>{event.location?.label ?? "Астана"}</span><span>{event.source_count} {event.source_count === 1 ? "источник" : "источника"}</span><span>доверие {Math.round(event.confidence * 100)}%</span><Link href={`/event/${event.slug}`}>Подробнее ↗</Link></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer"><span>010000 · CITY INTELLIGENCE</span><span>Факты, источники, история изменений</span><Link href="/sources">Реестр источников</Link></footer>
    </main>
  );
}
