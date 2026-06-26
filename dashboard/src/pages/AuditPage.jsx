import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from "recharts";
import StatsBar from "../components/StatsBar";
import ResponseLog from "../components/ResponseLog";
import ClaimInspector from "../components/ClaimInspector";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "#1a1e2a", border: "1px solid #252a38", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "#6b7594" }}>#{d?.index}</div>
      <div style={{ color: "#e4e8f0", fontWeight: 600 }}>Risk: {payload[0]?.value}/100</div>
      <div style={{ color: "#6b7594" }}>{d?.action}</div>
    </div>
  );
};

export default function AuditPage({ auditLog, onClear }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = filter === "ALL" ? auditLog : auditLog.filter(r => r.action_taken === filter);

  const stats = {
    total:    auditLog.length,
    flagged:  auditLog.filter(r => r.risk_score >= 40).length,
    blocked:  auditLog.filter(r => r.action_taken === "BLOCK").length,
    rewritten:auditLog.filter(r => r.rewritten).length,
    avgRisk:  auditLog.length
      ? Math.round(auditLog.reduce((a, b) => a + b.risk_score, 0) / auditLog.length)
      : 0,
  };

  const chartData = [...auditLog].reverse().map((r, i) => ({
    index: i + 1, risk: Math.round(r.risk_score), action: r.action_taken, _r: r,
  }));

  const handleClear = () => {
    if (confirmClear) {
      onClear();
      setSelected(null);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  if (auditLog.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Audit Log</h1>
            <p className="page-sub">Every intercepted response with full claim inspection</p>
          </div>
        </div>
        <div className="audit-empty">
          <div className="audit-empty-icon">📭</div>
          <div className="audit-empty-title">No responses yet</div>
          <div className="audit-empty-desc">
            Go to Chat and ask a question — every response will appear here with full hallucination analysis.
            Your audit log is saved automatically and persists across page refreshes.
          </div>
          <button className="btn-primary" onClick={() => navigate("/chat")}>Go to Chat →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-sub">
            {auditLog.length} response{auditLog.length !== 1 ? "s" : ""} intercepted · auto-saved to your account
            <span className="saved-badge">💾 Saved</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {["ALL","BLOCK","WARN","REWRITE","PASS"].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
          <button
            className={`btn-ghost ${confirmClear ? "btn-ghost-danger" : ""}`}
            onClick={handleClear}
          >
            {confirmClear ? "⚠ Confirm clear?" : "Clear log"}
          </button>
        </div>
      </div>

      <StatsBar stats={stats} />

      <div className="audit-grid">
        <div className="audit-left">
          <div className="chart-card">
            <div className="card-title">Risk score trend</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}
                onClick={e => e?.activePayload && setSelected(e.activePayload[0]?.payload?._r)}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c6af7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2233" vertical={false}/>
                <XAxis dataKey="index" tick={{ fontSize: 11, fill: "#6b7594" }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontSize: 11, fill: "#6b7594" }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <ReferenceLine y={75} stroke="#f04f5f" strokeDasharray="3 3" strokeOpacity={0.5}/>
                <ReferenceLine y={40} stroke="#f5a623" strokeDasharray="3 3" strokeOpacity={0.5}/>
                <Area type="monotone" dataKey="risk" stroke="#7c6af7" strokeWidth={2} fill="url(#rg)"
                  dot={{ r: 4, fill: "#7c6af7", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#7c6af7", stroke: "#13161e", strokeWidth: 2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <ResponseLog responses={filtered} selected={selected} onSelect={setSelected} />
        </div>
        <div className="audit-right">
          <ClaimInspector response={selected} />
        </div>
      </div>
    </div>
  );
}
