import { enabledBadge, loadSourceRegistry, reuseStatusBadge } from "@/lib/sources";

function formatReviewed(value: string | null): string {
  return value ?? "—";
}

export default function SourcesPage() {
  const sources = loadSourceRegistry();

  return (
    <main>
      <p className="kicker">010000.kz · internal development</p>
      <h1>Source Registry</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Category</th>
              <th>Enabled</th>
              <th>Reuse status</th>
              <th>Fetch method</th>
              <th>Last reviewed</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => {
              const enabledTone = enabledBadge(source);
              const reuseTone = reuseStatusBadge(source.reuse_status);

              return (
                <tr key={source.source_id}>
                  <td>
                    <span className="source-name">{source.name}</span>
                    <span className="source-id">{source.source_id}</span>
                  </td>
                  <td>{source.category}</td>
                  <td>
                    <span className={`badge ${enabledTone}`}>
                      {enabledTone} · {source.enabled ? "on" : "off"}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${reuseTone}`}>
                      {reuseTone} · {source.reuse_status}
                    </span>
                  </td>
                  <td className="fetch-method">{source.fetch_method}</td>
                  <td className="reviewed">{formatReviewed(source.last_reviewed_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
