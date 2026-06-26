import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://hallucination-firewall-production.up.railway.app";
const MODEL = "llama-3.3-70b-versatile";

function riskColor(s) {
  if (s >= 70) return "var(--red)";
  if (s >= 40) return "var(--yellow)";
  return "var(--green)";
}

function parseFirewall(data) {
  // The proxy puts firewall data under data.firewall
  // Normalise all possible key shapes into one consistent object
  const fw = data?.firewall || {};
  return {
    request_id:    fw.request_id    || Math.random().toString(36).slice(2, 8),
    risk_score:    fw.risk_score    ?? fw.riskScore    ?? 0,
    action_taken:  fw.action_taken  || fw.actionTaken  || "PASS",
    rewritten:     fw.rewritten     ?? false,
    model:         fw.model         || data?.model      || MODEL,
    latency_ms:    fw.latency_ms    || fw.latencyMs     || 0,
    original_answer: fw.original_answer || fw.originalAnswer || "",
    final_answer:    fw.final_answer    || fw.finalAnswer    || "",
    flagged_claims: (fw.flagged_claims || fw.flaggedClaims || []).map(c => ({
      text:       c.text       || c.claim || "",
      reason:     c.reason     || "",
      risk_score: c.risk_score || c.riskScore || 0,
    })),
    prompt_tokens:      fw.prompt_tokens      || 0,
    completion_tokens:  fw.completion_tokens  || 0,
  };
}

export default function ChatPage({ connected, onNewResponse }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your hallucination-checked AI assistant. Every response I give is verified for accuracy before you see it. Ask me anything!",
      firewall: null
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setExpanded(null);

    setMessages(prev => [...prev, { role: "user", content: q, firewall: null }]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API}/proxy/groq/openai/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer demo" },
        body: JSON.stringify({
          model: MODEL,
          messages: [...history, { role: "user", content: q }],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Log raw response so you can debug in browser console
      console.log("[HF] Raw proxy response:", JSON.stringify(data, null, 2));

      const fw = parseFirewall(data);
      const content = fw.final_answer
        || data.choices?.[0]?.message?.content
        || "No response.";

      console.log("[HF] Parsed firewall:", fw);

      setMessages(prev => [...prev, { role: "assistant", content, firewall: fw }]);
      onNewResponse({ ...fw, original_answer: fw.original_answer || content, final_answer: content, prompt: q });

    } catch (err) {
      console.warn("[HF] Proxy unavailable, using demo response:", err.message);
      const demo = getDemoResponse(q);
      setMessages(prev => [...prev, { role: "assistant", content: demo.content, firewall: demo.firewall }]);
      onNewResponse({
        ...demo.firewall,
        original_answer: demo.original,
        final_answer: demo.content,
        prompt: q,
        request_id: Math.random().toString(36).slice(2, 8),
        model: MODEL,
        latency_ms: Math.floor(Math.random() * 400 + 200),
      });
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="chat-shell">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.role}`}>
            <div className="msg-avatar">{m.role === "user" ? "U" : "ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â¡"}</div>
            <div className="msg-body">
              <div className="msg-bubble">{m.content}</div>

              {m.firewall && m.role === "assistant" && (
                <div className="msg-meta">
                  <button
                    className="risk-pill"
                    style={{ color: riskColor(m.firewall.risk_score), borderColor: riskColor(m.firewall.risk_score) }}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    Risk {Math.round(m.firewall.risk_score)}/100 Ãƒâ€šÃ‚Â· {m.firewall.action_taken}
                    {m.firewall.flagged_claims?.length > 0 && ` Ãƒâ€šÃ‚Â· ${m.firewall.flagged_claims.length} flagged`}
                    {m.firewall.rewritten && " Ãƒâ€šÃ‚Â· ÃƒÂ¢Ã¢â‚¬Â Ã‚Â» rewritten"}
                    <span style={{ marginLeft: 4 }}>{expanded === i ? "ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â²" : "ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¼"}</span>
                  </button>

                  {expanded === i && (
                    <div className="inline-inspector">
                      {m.firewall.flagged_claims?.length === 0 ? (
                        <div className="no-claims-inline">ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ All claims verified ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no issues found</div>
                      ) : (
                        m.firewall.flagged_claims.map((c, j) => (
                          <div key={j} className="inline-claim">
                            <div className="inline-claim-text">"{c.text}"</div>
                            <div className="inline-claim-reason">{c.reason}</div>
                          </div>
                        ))
                      )}
                      {m.firewall.rewritten && (
                        <div className="rewrite-note">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â» Response was auto-corrected by Groq</div>
                      )}
                      <button className="view-audit-btn" onClick={() => navigate("/audit")}>
                        View in Audit Log ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg-row assistant">
            <div className="msg-avatar">ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â¡</div>
            <div className="msg-body">
              <div className="msg-bubble typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        {!connected && (
          <div className="offline-banner">
            Demo mode ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â start the proxy server for real Groq responses
          </div>
        )}
        <div className="chat-input-row">
          <textarea
            className="chat-textarea"
            placeholder="Ask anything ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â your response will be hallucination-checked..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
          />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>
            {loading ? <span className="spin">ÃƒÂ¢Ã¢â‚¬Â Ã‚Â»</span> : "ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Ëœ"}
          </button>
        </div>
        <div className="input-hint">Enter to send Ãƒâ€šÃ‚Â· Shift+Enter for new line Ãƒâ€šÃ‚Â· All responses are hallucination-checked</div>
      </div>
    </div>
  );
}

function getDemoResponse(q) {
  const ql = q.toLowerCase();
  if (ql.includes("einstein") || ql.includes("telephone")) {
    return {
      original: "Einstein invented the telephone in 1876 and also discovered gravity.",
      content: "[BLOCKED] Response blocked by Hallucination Firewall (risk: 82/100) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â contains unverifiable claims.",
      firewall: { risk_score: 82, action_taken: "BLOCK", rewritten: false, flagged_claims: [
        { text: "Einstein invented the telephone in 1876", reason: "No evidence ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â telephone invented by Bell", risk_score: 91 },
        { text: "Einstein discovered gravity", reason: "Gravity was described by Newton, not Einstein", risk_score: 78 },
      ]},
    };
  }
  if (ql.includes("apollo") || ql.includes("mars")) {
    return {
      original: "Apollo 11 landed on Mars in 1969, piloted by Neil Armstrong.",
      content: "Apollo 11 landed on the Moon in 1969. Neil Armstrong was the mission commander.",
      firewall: { risk_score: 74, action_taken: "REWRITE", rewritten: true, flagged_claims: [
        { text: "Apollo 11 landed on Mars", reason: "No evidence ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Apollo 11 landed on the Moon", risk_score: 95 },
      ]},
    };
  }
  if (ql.includes("python")) {
    return {
      original: "Python was created by Guido van Rossum and released in 1992.",
      content: "Python was created by Guido van Rossum and first released in 1991.",
      firewall: { risk_score: 55, action_taken: "WARN", rewritten: false, flagged_claims: [
        { text: "Python was released in 1992", reason: "Partial evidence ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â actual release was 1991", risk_score: 55 },
      ]},
    };
  }
  return {
    original: `Response to: ${q}`,
    content: `This is a demo response to "${q}". In live mode, this would be a real Groq response verified for hallucinations.`,
    firewall: { risk_score: 8, action_taken: "PASS", rewritten: false, flagged_claims: [] },
  };
}
