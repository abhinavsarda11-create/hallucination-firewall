const TEAM = [
  { name: "Claim Extractor", role: "Groq · llama-3.3-70b-versatile", desc: "Reads every LLM response and extracts all verifiable factual claims as structured JSON." },
  { name: "FAISS Verifier", role: "Vector similarity search", desc: "Converts claims to embeddings and compares them against your knowledge index using cosine similarity." },
  { name: "Risk Scorer", role: "0–100 confidence engine", desc: "Aggregates verification scores into a single hallucination risk score per response." },
  { name: "Action Engine", role: "PASS · WARN · BLOCK · REWRITE", desc: "Applies configurable thresholds and takes automatic action — including Groq-powered rewriting." },
];

const PIPELINE = [
  { step: "01", title: "Request intercepted", desc: "Your app sends prompts to the firewall proxy instead of Groq directly." },
  { step: "02", title: "Groq responds", desc: "The proxy forwards the request to Groq and receives the raw LLM response." },
  { step: "03", title: "Claims extracted", desc: "A second Groq call extracts every factual claim from the response." },
  { step: "04", title: "Claims verified", desc: "Each claim is checked against your FAISS knowledge base for support." },
  { step: "05", title: "Risk scored", desc: "Unverified claims push the score toward 100. Verified claims keep it low." },
  { step: "06", title: "Action taken", desc: "Response is PASSED, WARNED, BLOCKED, or REWRITTEN based on thresholds." },
];

export default function AboutPage() {
  return (
    <div className="page">
      <div className="about-hero">
        <div style={{ fontSize: 48 }}>🛡</div>
        <h1 className="page-title" style={{ fontSize: 28 }}>Hallucination Firewall</h1>
        <p className="page-sub" style={{ maxWidth: 560, textAlign: "center", margin: "0 auto" }}>
          A drop-in middleware proxy that intercepts every LLM response, verifies its factual claims
          against your knowledge base, and acts — in real time — before hallucinations reach your users.
        </p>
        <div className="about-badges">
          <span className="about-badge">Powered by Groq</span>
          <span className="about-badge">llama-3.3-70b-versatile</span>
          <span className="about-badge">FAISS vector search</span>
          <span className="about-badge">FastAPI proxy</span>
        </div>
      </div>

      <div className="section-title">The pipeline</div>
      <div className="pipeline-list">
        {PIPELINE.map(p => (
          <div key={p.step} className="pipeline-step">
            <div className="pipeline-num">{p.step}</div>
            <div>
              <div className="pipeline-title">{p.title}</div>
              <div className="pipeline-desc">{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 40 }}>Core components</div>
      <div className="team-grid">
        {TEAM.map(t => (
          <div key={t.name} className="team-card">
            <div className="team-name">{t.name}</div>
            <div className="team-role">{t.role}</div>
            <div className="team-desc">{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="about-footer">
        <p>Built with FastAPI · Groq · FAISS · React · Recharts</p>
        <p style={{ marginTop: 4 }}>MIT License · Open source</p>
      </div>
    </div>
  );
}
