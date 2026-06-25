export default function StatsBar({ stats }) {
  const cards = [
    { label: "Total responses", value: stats.total, color: "#6366f1" },
    { label: "Flagged (≥40)", value: stats.flagged, color: "#f59e0b" },
    { label: "Blocked", value: stats.blocked, color: "#ef4444" },
    { label: "Avg risk score", value: `${stats.avgRisk}/100`, color: riskColor(stats.avgRisk) },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: "#f9f9f9", borderRadius: 10, padding: "0.75rem 1rem",
          borderLeft: `3px solid ${c.color}`,
        }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: "#111" }}>{c.value}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function riskColor(score) {
  if (score >= 70) return "#ef4444";
  if (score >= 40) return "#f59e0b";
  return "#22c55e";
}
