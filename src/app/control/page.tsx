import Link from "next/link";
import { checkSourceHealth } from "@/lib/scheduler";
import { runtimeStore } from "@/lib/runtime";
import { loadSourceRegistry } from "@/lib/sources";

export const dynamic = "force-dynamic";

export default async function ControlPage() {
  const [state, health] = await Promise.all([runtimeStore.read(), checkSourceHealth(loadSourceRegistry())]);
  const lastRun = state.collection_runs.at(-1);
  const metrics = {
    raw_items: state.raw_items.length,
    events: state.event_records.length,
    published: state.event_records.filter(({ event }) => event.published_at).length,
    collection_runs: state.collection_runs.length,
    last_run: lastRun?.status ?? "pending",
    extraction_provider: "deterministic rules (AI provider not configured)",
  };
  return (
    <main className="site-shell control-shell">
      <header className="topbar"><Link className="brand" href="/"><span className="brand-mark">010000</span><span className="brand-city">CONTROL PLANE</span></Link><Link className="back-link" href="/">← К ленте</Link></header>
      <section className="control-hero"><p className="eyebrow">ЛОКАЛЬНАЯ ДИАГНОСТИКА</p><h1>Система без зелёных иллюзий.</h1><p>Страница показывает, что действительно работает, а что остаётся заблокированным.</p></section>
      <section className="metric-grid">{Object.entries(metrics).map(([key, value]) => <div className="metric" key={key}><strong>{String(value)}</strong><span>{key.replaceAll("_", " ")}</span></div>)}</section>
      <section className="health-section"><div className="section-head"><div><p className="eyebrow">P0 ИСТОЧНИКИ</p><h2>Готовность сбора</h2></div><span className="section-count">{health.filter((item) => item.live_collection === "available").length}/{health.length}</span></div><div className="health-list">{health.map((item) => <article key={item.source_id}><div><strong>{item.source_id}</strong><span className={`health-pill health-${item.live_collection}`}>{item.live_collection}</span></div><p>{item.details}</p></article>)}</div></section>
      <section className="health-section"><div className="section-head"><div><p className="eyebrow">COLLECTION LOG</p><h2>Последние циклы</h2></div></div><div className="health-list">{state.collection_runs.slice(-10).reverse().map((run) => <article key={run.id}><div><strong>{new Date(run.finished_at).toLocaleString("ru-RU")}</strong><span className={`health-pill health-${run.status === "ok" ? "available" : "blocked"}`}>{run.status}</span></div><p>{run.sources.map((source) => `${source.source_id}: ${source.status}, +${source.created}, =${source.duplicates}${source.error ? ` (${source.error})` : ""}`).join(" · ")}</p></article>)}{state.collection_runs.length === 0 && <p className="empty-copy">Первый фоновый цикл ещё выполняется.</p>}</div></section>
    </main>
  );
}
