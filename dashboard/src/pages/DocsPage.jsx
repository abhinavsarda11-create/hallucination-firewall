const HOW_IT_WORKS = [
  { step: "01", icon: "📥", title: "Request intercepted", desc: "Instead of calling Groq directly, your app sends requests to the Hallucination Firewall proxy running at localhost:8080. The proxy forwards them to Groq on your behalf." },
  { step: "02", icon: "🤖", title: "Groq responds", desc: "Groq processes the request using the llama-3.3-70b-versatile model and sends back a raw response. The proxy catches this before it reaches your app." },
  { step: "03", icon: "🔍", title: "Claims extracted", desc: "A second Groq call reads the response and pulls out every verifiable factual statement — things like dates, names, scientific facts, or historical events." },
  { step: "04", icon: "📚", title: "Claims verified", desc: "Each claim is converted to a vector embedding and compared against your FAISS knowledge index. The closer the match, the more evidence supports the claim." },
  { step: "05", icon: "📊", title: "Risk scored", desc: "Claims with low similarity to your knowledge base get high risk scores. The overall response risk is a weighted combination of all individual claim scores, from 0 to 100." },
  { step: "06", icon: "⚡", title: "Action taken", desc: "Based on your configured thresholds, the response is passed through, flagged with a warning, blocked entirely, or automatically rewritten by Groq to correct the issues." },
];

const ACTIONS = [
  { name: "PASS",    color: "#22d3a0", bg: "rgba(34,211,160,.08)",  border: "rgba(34,211,160,.2)",  desc: "Risk score is below 40. The response is verified and returned to your app unchanged." },
  { name: "WARN",    color: "#f5a623", bg: "rgba(245,166,35,.08)",  border: "rgba(245,166,35,.2)",  desc: "Risk score is between 40–74. The response is returned but flagged with risk metadata so your app can decide what to do." },
  { name: "BLOCK",   color: "#f04f5f", bg: "rgba(240,79,95,.08)",   border: "rgba(240,79,95,.2)",   desc: "Risk score is 75 or above. The response is replaced with a block message. The hallucinated answer never reaches the user." },
  { name: "REWRITE", color: "#4f8ef0", bg: "rgba(79,142,240,.08)",  border: "rgba(79,142,240,.2)",  desc: "When configured, Groq automatically rewrites the response to correct or remove flagged claims before returning it to the user." },
];

const THRESHOLDS = [
  { label: "Warn threshold",    value: "≥ 40",  color: "#f5a623", desc: "Responses above this score are flagged. Your app receives the answer plus a risk warning." },
  { label: "Block threshold",   value: "≥ 75",  color: "#f04f5f", desc: "Responses above this score are blocked completely. The answer is replaced with an error message." },
  { label: "Rewrite threshold", value: "≥ 60",  color: "#4f8ef0", desc: "When REWRITE action is enabled, responses above this score are corrected automatically by Groq." },
];

const FAQS = [
  {
    q: "Do I need to build a knowledge index?",
    a: "No — the firewall works without one. Without an index, claims are scored as 'uncertain' and responses above the warn threshold are flagged. Building an index (from your own documents) gives you accurate, source-specific verification.",
  },
  {
    q: "How do I build the knowledge index?",
    a: "Drop your reference documents (.txt or .pdf) into the data/knowledge_docs/ folder, then run: python scripts/build_index.py — this creates a FAISS index that the verifier uses to check claims.",
  },
  {
    q: "What model does the firewall use?",
    a: "Both the main chat proxy and the claim extractor use llama-3.3-70b-versatile via Groq. This model is fast, accurate, and free to use with a Groq API key from console.groq.com.",
  },
  {
    q: "Will this slow down my responses?",
    a: "Slightly. The firewall adds one extra Groq call for claim extraction. On average this adds 300–800ms. Groq's speed (up to 800 tokens/second) keeps this overhead minimal.",
  },
  {
    q: "Can I use this with OpenAI instead of Groq?",
    a: "Yes. There is a bonus /proxy/openai endpoint that works the same way. Point your OpenAI calls at localhost:8080/proxy/openai and add your OPENAI_API_KEY to the .env file.",
  },
  {
    q: "Is the Neo4j logging required?",
    a: "No. Neo4j logging is completely optional. Set NEO4J_ENABLED=false in your .env file (which is the default). The firewall works fully without it.",
  },
];

const ENDPOINTS = [
  { method: "GET",  path: "/health",                                 desc: "Check if the proxy is running and the index is loaded" },
  { method: "POST", path: "/proxy/groq/openai/v1/chat/completions",  desc: "Main intercept — drop-in replacement for the Groq API" },
  { method: "POST", path: "/proxy/openai/v1/chat/completions",       desc: "Bonus intercept — drop-in replacement for the OpenAI API" },
];

export default function DocsPage() {
  return (
    <div className="page docs-page">

      {/* Hero */}
      <div className="docs-hero">
        <h1 className="page-title">Documentation</h1>
        <p className="docs-hero-sub">
          Everything you need to understand, configure, and integrate the Hallucination Firewall into your application.
        </p>
      </div>

      {/* How it works */}
      <div className="docs-section">
        <div className="docs-section-label">How it works</div>
        <div className="docs-section-desc">
          The Hallucination Firewall sits between your app and the Groq API. Every response passes through a 6-stage verification pipeline before reaching your users.
        </div>
        <div className="docs-steps">
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} className="docs-step">
              <div className="docs-step-left">
                <div className="docs-step-icon">{s.icon}</div>
                <div className="docs-step-num">{s.step}</div>
              </div>
              <div className="docs-step-body">
                <div className="docs-step-title">{s.title}</div>
                <div className="docs-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="docs-section">
        <div className="docs-section-label">Firewall actions</div>
        <div className="docs-section-desc">
          Based on the risk score, the firewall takes one of four actions. You configure the thresholds in your .env file.
        </div>
        <div className="docs-actions-grid">
          {ACTIONS.map(a => (
            <div key={a.name} className="docs-action-card" style={{ borderColor: a.border, background: a.bg }}>
              <div className="docs-action-name" style={{ color: a.color }}>{a.name}</div>
              <div className="docs-action-desc">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Thresholds */}
      <div className="docs-section">
        <div className="docs-section-label">Risk thresholds</div>
        <div className="docs-section-desc">
          All thresholds are configurable via environment variables. You can tune them based on how strict you want the firewall to be.
        </div>
        <div className="docs-thresholds">
          {THRESHOLDS.map(t => (
            <div key={t.label} className="docs-threshold-row">
              <div className="docs-threshold-left">
                <span className="docs-threshold-label">{t.label}</span>
                <span className="docs-threshold-value" style={{ color: t.color }}>{t.value}</span>
              </div>
              <div className="docs-threshold-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API endpoints */}
      <div className="docs-section">
        <div className="docs-section-label">API endpoints</div>
        <div className="docs-section-desc">
          The proxy exposes the same API shape as Groq and OpenAI — just change the base URL in your app.
        </div>
        <div className="docs-endpoints">
          {ENDPOINTS.map(e => (
            <div key={e.path} className="docs-endpoint-row">
              <span className={`docs-method method-${e.method}`}>{e.method}</span>
              <div className="docs-endpoint-info">
                <div className="docs-endpoint-path">{e.path}</div>
                <div className="docs-endpoint-desc">{e.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="docs-callout">
          <span className="docs-callout-icon">💡</span>
          To integrate, change your base URL from <strong>https://api.groq.com</strong> to <strong>http://localhost:8080/proxy/groq</strong> — everything else in your app stays exactly the same.
        </div>
      </div>

      {/* Response format */}
      <div className="docs-section">
        <div className="docs-section-label">What you get back</div>
        <div className="docs-section-desc">
          Every intercepted response includes the normal Groq response plus a <strong>firewall</strong> field with the full audit report.
        </div>
        <div className="docs-response-fields">
          {[
            { field: "risk_score",      type: "number 0–100", desc: "Overall hallucination risk for this response. 0 = safe, 100 = very likely hallucinated." },
            { field: "action_taken",    type: "string",       desc: "What the firewall did — PASS, WARN, BLOCK, or REWRITE." },
            { field: "flagged_claims",  type: "array",        desc: "List of specific claims that couldn't be verified, each with the claim text, a reason, and its individual risk score." },
            { field: "original_answer", type: "string",       desc: "The raw response from Groq before any rewriting." },
            { field: "final_answer",    type: "string",       desc: "The answer that was actually returned — may differ from original if rewritten or blocked." },
            { field: "rewritten",       type: "boolean",      desc: "True if the response was automatically corrected by Groq." },
            { field: "latency_ms",      type: "number",       desc: "Time in milliseconds from sending the request to Groq to completing the firewall pipeline." },
            { field: "request_id",      type: "string",       desc: "Unique 8-character ID for this request, used to correlate logs." },
          ].map(f => (
            <div key={f.field} className="docs-field-row">
              <div className="docs-field-left">
                <span className="docs-field-name">{f.field}</span>
                <span className="docs-field-type">{f.type}</span>
              </div>
              <div className="docs-field-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="docs-section">
        <div className="docs-section-label">Frequently asked questions</div>
        <div className="docs-faq">
          {FAQS.map(f => (
            <div key={f.q} className="docs-faq-item">
              <div className="docs-faq-q">{f.q}</div>
              <div className="docs-faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
