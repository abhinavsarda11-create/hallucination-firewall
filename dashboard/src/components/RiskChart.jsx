import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "#1a1e2a", border: "1px solid #252a38", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#6b7594", marginBottom: 4 }}>Response #{label}</div>
      <div style={{ color: "#e4e8f0", fontWeight: 600 }}>Risk: {payload[0]?.value}/100</div>
      {d && <div style={{ color: "#6b7594", marginTop: 2 }}>{d.action}</div>}
    </div>
  );
};

export default function RiskChart({ responses, selected, onSelect }) {
  const data = responses.map((r, i) => ({
    index: i + 1, risk: Math.round(r.risk_score),
    action: r.action_taken, id: r.request_id, _r: r,
  }));

  return (
    <div className="chart-card">
      <div className="card-title">Risk score trend</div>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}
          onClick={e => e?.activePayload && onSelect(e.activePayload[0]?.payload?._r)}>
          <defs>
            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7c6af7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c6af7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2233" vertical={false} />
          <XAxis dataKey="index" tick={{ fontSize: 11, fill: "#6b7594" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7594" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={75} stroke="#f04f5f" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={40} stroke="#f5a623" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Area type="monotone" dataKey="risk" stroke="#7c6af7" strokeWidth={2}
            fill="url(#riskGrad)" dot={{ r: 4, fill: "#7c6af7", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#7c6af7", stroke: "#13161e", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #252a38" }}>
        {[["#f04f5f","Block ≥75"],["#f5a623","Warn ≥40"],["#7c6af7","Risk trend"]].map(([c,l]) => (
          <div key={l} style={{ display:"flex", alignItems:"center", gap: 5, fontSize: 11, color: "#6b7594" }}>
            <div style={{ width: 20, height: 2, background: c, borderRadius: 2 }} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}
