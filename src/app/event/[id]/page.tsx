import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoEventRecords } from "@/lib/demo-feed";
import { getEventRecord } from "@/lib/runtime";

export function generateStaticParams() {
  return getDemoEventRecords().map(({ event }) => ({ id: event.slug }));
}

function dateTime(value: string | null): string {
  if (!value) return "Не указано источником";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Almaty" }).format(new Date(value));
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await getEventRecord(id);
  if (!record) notFound();
  const { event, sources, revisions } = record;

  return (
    <main className="site-shell detail-shell">
      <header className="topbar"><Link className="brand" href="/"><span className="brand-mark">010000</span><span className="brand-city">ASTANA / LIVE</span></Link><Link className="back-link" href="/">← К ленте</Link></header>
      <article className="event-detail">
        <div className="detail-status"><span className={`category-dot category-${event.category.toLowerCase()}`} />{event.lifecycle} · FIXTURE DATA</div>
        <h1>{event.title}</h1>
        <p className="detail-summary">{event.summary}</p>
        <dl className="fact-grid"><div><dt>Где</dt><dd>{event.location?.label ?? "Астана, точное место не указано"}</dd></div><div><dt>Когда</dt><dd>{dateTime(event.starts_at)}</dd></div><div><dt>Доверие</dt><dd>{Math.round(event.confidence * 100)}%</dd></div><div><dt>Значимость</dt><dd>{Math.round(event.importance * 100)}%</dd></div></dl>

        <section className="detail-section"><p className="eyebrow">ЧТО ИЗВЕСТНО</p><h2>Подтверждённые утверждения</h2><ul className="claim-list">{event.claims.map((claim) => <li key={claim}>{claim}</li>)}</ul></section>
        <section className="detail-section"><p className="eyebrow">ПРОИСХОЖДЕНИЕ</p><h2>Источники</h2><div className="source-list">{sources.map((source) => <a href={source.source_url} key={source.id} target="_blank" rel="noreferrer"><span><strong>{source.source_name}</strong><small>{source.role} · {dateTime(source.observed_at)}</small></span><span>↗</span></a>)}</div></section>
        <section className="detail-section"><p className="eyebrow">ИСТОРИЯ</p><h2>Изменения события</h2>{revisions.length ? <ol className="revision-list">{revisions.map((revision) => <li key={revision.id}><time>{dateTime(revision.created_at)}</time><span>{revision.reason}</span></li>)}</ol> : <p className="empty-copy">После первой публикации значимых изменений не зафиксировано.</p>}</section>
      </article>
    </main>
  );
}
