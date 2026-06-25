export default function ClaimInspector({ response }) {
  if (!response) {
    return (
      <div style={{
        border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "1.5rem",
        color: "#bbb", fontSize: 13, textAlign: "center", height: "fit-content",
        marginTop: "1rem",
      }}>
        Click a response to inspect claims
      </div>
    );
  }

  const { original_answer, final_answer, risk_score, action_taken, flagged_claims, rewritten, latency_ms, model } = response;

  return (
    <div style={{ border: "0.5px solid #e5e7eb", borderRadius: 10, marginTop: "1rem", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "0.75rem 1rem", borderBottom: "0.5px solid #e5e7eb", background: "#fafafa" }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Claim inspector</div>
        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{model} · {Math.round(latency_ms)}ms</div>
      </div>

      <div style={{ padding: "1rem" }}>
        {/* Risk score dial */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div style={{
            display: "inline-flex", flexDirection: "column", alignItems: "center",
            width: 80, height: 80, borderRadius: "50%", justifyContent: "center",
            background: riskBg(risk_score), border: `2px solid ${riskBorder(risk_score)}`,
          }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: riskText(risk_score) }}>{Math.round(risk_score)}</span>
            <span style={{ fontSize: 10, color: riskText(risk_score) }}>/ 100</span>
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>Hallucination risk</div>
        </div>

        {/* Original vs Final */}
        <div style={{ marginBottom: "0.75rem" }}>
          <p style={{ fontSize: 11, color: "#999", margin: "0 0 4px", fontWeight: 500 }}>ORIGINAL</p>
          <div style={{ fontSize: 12, color: "#444", background: "#f9f9f9", borderRadius: 6, padding: "0.5rem 0.75rem", lineHeight: 1.5 }}>
            {original_answer}
          </div>
        </div>

        {rewritten && (
          <div style={{ marginBottom: "0.75rem" }}>
            <p style={{ fontSize: 11, color: "#1e40af", margin: "0 0 4px", fontWeight: 500 }}>REWRITTEN ✓</p>
            <div style={{ fontSize: 12, color: "#1e40af", background: "#dbeafe", borderRadius: 6, padding: "0.5rem 0.75rem", lineHeight: 1.5 }}>
              {final_answer}
            </div>
          </div>
        )}

        {/* Flagged claims */}
        <p style={{ fontSize: 11, color: "#999", margin: "0.75rem 0 6px", fontWeight: 500 }}>
          FLAGGED CLAIMS ({flagged_claims.length})
        </p>
        {flagged_claims.length === 0 && (
          <div style={{ fontSize: 12, color: "#aaa" }}>No claims flagged.</div>
        )}
        {flagged_claims.map((c, i) => (
          <div key={i} style={{
            background: "#fff7f7", border: "0.5px solid #fecaca",
            borderRadius: 6, padding: "0.5rem 0.75rem", marginBottom: 6,
          }}>
            <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 3 }}>"{c.text}"</div>
            <div style={{ fontSize: 11, color: "#b45309" }}>{c.reason}</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
              Risk: {Math.round(c.risk_score)}/100
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function riskBg(s) { return s >= 70 ? "#fee2e2" : s >= 40 ? "#fef9c3" : "#dcfce7"; }
function riskBorder(s) { return s >= 70 ? "#fca5a5" : s >= 40 ? "#fcd34d" : "#86efac"; }
function riskText(s) { return s >= 70 ? "#991b1b" : s >= 40 ? "#854d0e" : "#166534"; }
