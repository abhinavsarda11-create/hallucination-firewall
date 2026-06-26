export default function StatsBar({ stats }) {
  const cards = [
    { label: "Total intercepted", value: stats.total,   color: "#7c6af7" },
    { label: "Flagged (≥40)",     value: stats.flagged,  color: "#f5a623" },
    { label: "Blocked",           value: stats.blocked,  color: "#f04f5f" },
    { label: "Auto-rewritten",    value: stats.rewritten,color: "#4f8ef0" },
    { label: "Avg risk score",    value: `${stats.avgRisk}/100`, color: riskColor(stats.avgRisk) },
  ];
  return (
    <div className="stats-bar">
      {cards.map(c => (
        <div key={c.label} className="stat-card">
          <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
          <div className="stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
function riskColor(s) { return s >= 70 ? "#f04f5f" : s >= 40 ? "#f5a623" : "#22d3a0"; }
