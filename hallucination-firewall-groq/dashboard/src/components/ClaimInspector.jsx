export default function ClaimInspector({ response }) {
  if (!response) return (
    <div className="inspector">
      <div className="inspector-empty">
        <div className="inspector-empty-icon">🔍</div>
        <div>Select a response to inspect</div>
      </div>
    </div>
  );

  const { original_answer, final_answer, risk_score, action_taken, flagged_claims, rewritten, latency_ms, model, request_id } = response;
  const s = Math.round(risk_score);
  const [dialBg, dialColor, dialRing] =
    s >= 70 ? ["rgba(240,79,95,.12)", "#f04f5f", "rgba(240,79,95,.4)"] :
    s >= 40 ? ["rgba(245,166,35,.1)", "#f5a623", "rgba(245,166,35,.4)"] :
              ["rgba(34,211,160,.08)", "#22d3a0", "rgba(34,211,160,.3)"];

  return (
    <div className="inspector">
      {/* Header */}
      <div className="inspector-header">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Claim Inspector</div>
          <span className={`action-chip chip-${action_taken}`}>{action_taken}</span>
        </div>
        <div className="inspector-model">{model} · {request_id} · {Math.round(latency_ms)}ms</div>
      </div>

      {/* Risk dial */}
      <div className="risk-dial-wrap">
        <div className="risk-dial" style={{ background: dialBg, boxShadow: `0 0 0 2px ${dialRing}`, color: dialColor }}>
          <span className="risk-dial-num">{s}</span>
          <span className="risk-dial-denom">/ 100</span>
        </div>
        <span className="risk-dial-label">Hallucination risk</span>
      </div>

      {/* Original */}
      <div>
        <div className="section-label">Original response</div>
        <div className="text-bubble bubble-original">{original_answer}</div>
      </div>

      {/* Rewritten */}
      {rewritten && (
        <div>
          <div className="section-label" style={{ color: "#4f8ef0" }}>↻ Auto-rewritten</div>
          <div className="text-bubble bubble-rewritten">{final_answer}</div>
        </div>
      )}

      {/* Flagged claims */}
      <div>
        <div className="section-label">Flagged claims ({flagged_claims.length})</div>
        {flagged_claims.length === 0 ? (
          <div className="no-claims"><span>✓</span> No claims flagged — response appears accurate.</div>
        ) : (
          flagged_claims.map((c, i) => (
            <div key={i} className="claim-card">
              <div className="claim-text">"{c.text}"</div>
              <div className="claim-reason">{c.reason}</div>
              <div className="claim-score">Risk score: {Math.round(c.risk_score)}/100</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
