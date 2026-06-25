import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

export default function RiskChart({ responses }) {
  const data = responses.map((r, i) => ({
    name: r.request_id,
    risk: Math.round(r.risk_score),
    index: i + 1,
  }));

  return (
    <div style={{ marginTop: "1rem" }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 8 }}>Risk score trend</p>
      <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: 10, padding: "1rem" }}>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
            <XAxis dataKey="index" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
              formatter={(v) => [`${v}/100`, "Risk"]}
              labelFormatter={(l) => `Response #${l}`}
            />
            <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Block", position: "right", fontSize: 10 }} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Warn", position: "right", fontSize: 10 }} />
            <Line type="monotone" dataKey="risk" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
