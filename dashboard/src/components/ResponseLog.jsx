const ACTION_COLORS = {
  PASS: { bg: "#dcfce7", text: "#166534" },
  WARN: { bg: "#fef9c3", text: "#854d0e" },
  REWRITE: { bg: "#dbeafe", text: "#1e40af" },
  BLOCK: { bg: "#fee2e2", text: "#991b1b" },
};

export default function ResponseLog({ responses, selected, onSelect }) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 8 }}>
        Response log ({responses.length})
      </p>
      <div style={{ border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        {responses.length === 0 && (
          <div style={{ padding: "1.5rem", color: "#aaa", fontSize: 13, textAlign: "center" }}>
            Waiting for responses...
          </div>
        )}
        {responses.map((r, i) => {
          const ac = ACTION_COLORS[r.action_taken] || ACTION_COLORS.PASS;
          const isSelected = selected?.request_id === r.request_id;
          return (
            <div
              key={r.request_id}
              onClick={() => onSelect(isSelected ? null : r)}
              style={{
                padding: "0.7rem 1rem",
                borderBottom: i < responses.length - 1 ? "0.5px solid #e5e7eb" : "none",
                background: isSelected ? "#f0f4ff" : "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Risk gauge */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: riskBg(r.risk_score), fontSize: 12, fontWeight: 500,
                color: riskText(r.risk_score),
              }}>
                {Math.round(r.risk_score)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.original_answer}
                </div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                  {r.request_id} · {r.model} · {Math.round(r.latency_ms)}ms
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {r.rewritten && (
                  <span style={{ fontSize: 10, background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 20 }}>
                    rewritten
                  </span>
                )}
                <span style={{ fontSize: 11, background: ac.bg, color: ac.text, padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>
                  {r.action_taken}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function riskBg(score) {
  if (score >= 70) return "#fee2e2";
  if (score >= 40) return "#fef9c3";
  return "#dcfce7";
}

function riskText(score) {
  if (score >= 70) return "#991b1b";
  if (score >= 40) return "#854d0e";
  return "#166534";
}
