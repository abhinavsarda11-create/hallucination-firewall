export default function ResponseLog({ responses, selected, onSelect }) {
  return (
    <div>
      <div className="log-header">
        <span className="log-title">Response log ({responses.length})</span>
      </div>
      <div className="log-wrap">
        {responses.length === 0 && <div className="log-empty">No responses match this filter.</div>}
        {responses.map(r => {
          const isSelected = selected?.request_id === r.request_id;
          return (
            <div key={r.request_id} className={`log-row ${isSelected ? "active" : ""}`} onClick={() => onSelect(isSelected ? null : r)}>
              <RiskBadge score={r.risk_score} />
              <div className="log-text">
                <div className="log-answer">{r.original_answer}</div>
                <div className="log-meta">{r.request_id} · {r.model} · {Math.round(r.latency_ms)}ms · {r.flagged_claims.length} claim{r.flagged_claims.length !== 1 ? "s" : ""} flagged</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <span className={`action-chip chip-${r.action_taken}`}>{r.action_taken}</span>
                {r.rewritten && <span style={{ fontSize: 10, color: "#4f8ef0" }}>↻ rewritten</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskBadge({ score }) {
  const s = Math.round(score);
  const [bg, color, ring] =
    s >= 70 ? ["rgba(240,79,95,.12)", "#f04f5f", "rgba(240,79,95,.3)"] :
    s >= 40 ? ["rgba(245,166,35,.1)", "#f5a623", "rgba(245,166,35,.3)"] :
              ["rgba(34,211,160,.1)", "#22d3a0", "rgba(34,211,160,.25)"];
  return (
    <div className="risk-badge" style={{ background: bg, color, boxShadow: `0 0 0 1.5px ${ring}` }}>{s}</div>
  );
}
