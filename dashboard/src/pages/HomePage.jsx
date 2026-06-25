import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: "🔍", title: "Claim extraction", desc: "Groq pulls every verifiable factual claim from LLM responses automatically." },
  { icon: "📚", title: "FAISS verification", desc: "Claims are checked against your knowledge index using semantic similarity." },
  { icon: "📊", title: "Risk scoring", desc: "Each response gets a 0–100 hallucination risk score with detailed breakdowns." },
  { icon: "⚡", title: "Auto-rewrite", desc: "Flagged responses are automatically corrected by Groq before reaching users." },
  { icon: "🛡", title: "Block & warn", desc: "Configure thresholds to block or warn on high-risk responses in real time." },
  { icon: "🗂", title: "Audit log", desc: "Full history of every intercepted response with claim-level inspection." },
];

export default function HomePage({ user, connected }) {
  const navigate = useNavigate();
  return (
    <div className="page">
      <div className="home-hero">
        <div className="hero-badge">
          <span className={`conn-dot-sm ${connected ? "green" : "yellow"}`} />
          {connected ? "Proxy connected · localhost:8080" : "Demo mode · start proxy to connect"}
        </div>
        <h1 className="hero-title">Welcome back, {user?.name?.split(" ")[0] || "there"} 👋</h1>
        <p className="hero-sub">
          Your hallucination firewall is active. Every Groq response is intercepted,
          verified, and scored before reaching your users.
        </p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate("/chat")}>Open Chat →</button>
          <button className="btn-secondary" onClick={() => navigate("/audit")}>View Audit Log</button>
        </div>
      </div>

      <div className="quick-stats">
        {[
          { label: "Model", value: "llama-3.3-70b", color: "var(--accent)" },
          { label: "Warn threshold", value: "≥ 40", color: "var(--yellow)" },
          { label: "Block threshold", value: "≥ 75", color: "var(--red)" },
          { label: "Action", value: "WARN", color: "var(--green)" },
        ].map(s => (
          <div key={s.label} className="qs-card">
            <div className="qs-value" style={{ color: s.color }}>{s.value}</div>
            <div className="qs-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-title">How it works</div>
      <div className="features-grid">
        {FEATURES.map(f => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
