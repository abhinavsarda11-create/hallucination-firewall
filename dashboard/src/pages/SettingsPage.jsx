import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage({ user, onLogout, onClearAudit, auditCount }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [auditCleared, setAuditCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cfg, setCfg] = useState({
    action: "WARN",
    warn: 40,
    block: 75,
    rewrite: 60,
    model: "llama-3.3-70b-versatile",
    neo4j: false,
  });

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAudit = () => {
    if (confirmClear) {
      onClearAudit();
      setAuditCleared(true);
      setConfirmClear(false);
      setTimeout(() => setAuditCleared(false), 2500);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Configure firewall behaviour, thresholds, and account</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Account */}
        <div className="settings-card">
          <div className="settings-card-title">Account</div>
          <div className="settings-row">
            <div className="settings-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="settings-user-name">{user?.name}</div>
              <div className="settings-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="btn-danger" onClick={() => { onLogout(); navigate("/login"); }}>Sign out</button>
        </div>

        {/* Data */}
        <div className="settings-card">
          <div className="settings-card-title">Your data</div>
          <div className="settings-data-row">
            <div className="settings-data-icon">💾</div>
            <div>
              <div className="settings-data-label">Audit log</div>
              <div className="settings-data-desc">
                {auditCount > 0
                  ? `${auditCount} response${auditCount !== 1 ? "s" : ""} saved to your account — persists across page refreshes`
                  : "No responses saved yet — go to Chat to start"}
              </div>
            </div>
          </div>
          <div className="settings-data-row">
            <div className="settings-data-icon">🔑</div>
            <div>
              <div className="settings-data-label">Session storage</div>
              <div className="settings-data-desc">Your login and audit log are saved in your browser's local storage, tied to your email address.</div>
            </div>
          </div>
          {auditCount > 0 && (
            <button className={`btn-danger ${auditCleared ? "btn-success" : ""}`} onClick={handleClearAudit}>
              {auditCleared ? "✓ Audit log cleared" : confirmClear ? "⚠ Confirm? This cannot be undone" : `Clear audit log (${auditCount} entries)`}
            </button>
          )}
        </div>

        {/* Firewall config */}
        <div className="settings-card">
          <div className="settings-card-title">Firewall action</div>
          <div className="field-group">
            <label className="field-label">Default action</label>
            <select className="field-input" value={cfg.action} onChange={e => set("action", e.target.value)}>
              <option>WARN</option><option>BLOCK</option><option>REWRITE</option><option>PASS</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Model</label>
            <select className="field-input" value={cfg.model} onChange={e => set("model", e.target.value)}>
              <option>llama-3.3-70b-versatile</option>
              <option>llama3-70b-8192</option>
              <option>mixtral-8x7b-32768</option>
            </select>
          </div>
        </div>

        {/* Thresholds */}
        <div className="settings-card">
          <div className="settings-card-title">Risk thresholds</div>
          {[
            { key: "warn",    label: "Warn threshold",    color: "var(--yellow)" },
            { key: "block",   label: "Block threshold",   color: "var(--red)" },
            { key: "rewrite", label: "Rewrite threshold", color: "var(--blue)" },
          ].map(t => (
            <div key={t.key} className="field-group">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label className="field-label">{t.label}</label>
                <span style={{ fontSize: 12, color: t.color, fontWeight: 600 }}>{cfg[t.key]}/100</span>
              </div>
              <input type="range" min={0} max={100} value={cfg[t.key]}
                onChange={e => set(t.key, Number(e.target.value))}
                style={{ width: "100%", accentColor: t.color }} />
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div className="settings-card">
          <div className="settings-card-title">Integrations</div>
          {[
            { key: "neo4j", label: "Neo4j knowledge graph", desc: "Log all claims to a graph database for deeper analysis", val: cfg.neo4j },
            { key: "openai", label: "OpenAI proxy", desc: "Also intercept /proxy/openai calls alongside Groq", val: true },
          ].map(t => (
            <div key={t.key} className="toggle-row">
              <div>
                <div className="toggle-label">{t.label}</div>
                <div className="toggle-desc">{t.desc}</div>
              </div>
              <button className={`toggle-btn ${t.val ? "on" : ""}`} onClick={() => t.key !== "openai" && set(t.key, !cfg[t.key])}>
                <span className="toggle-thumb" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
        <button className="btn-primary" onClick={save}>{saved ? "✓ Saved!" : "Save settings"}</button>
      </div>
    </div>
  );
}
