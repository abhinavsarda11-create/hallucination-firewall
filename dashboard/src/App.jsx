import { useState, useEffect, useRef } from "react";
import ResponseLog from "./components/ResponseLog";
import RiskChart from "./components/RiskChart";
import StatsBar from "./components/StatsBar";
import ClaimInspector from "./components/ClaimInspector";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/ws/audit";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function App() {
  const [responses, setResponses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    // Poll health endpoint every 3s to check connection
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API_URL}/health`);
        setConnected(r.ok);
      } catch {
        setConnected(false);
      }
    }, 3000);

    // Seed demo data so dashboard works without live proxy
    setResponses(DEMO_DATA);

    return () => clearInterval(poll);
  }, []);

  const stats = {
    total: responses.length,
    flagged: responses.filter(r => r.risk_score >= 40).length,
    blocked: responses.filter(r => r.action_taken === "BLOCK").length,
    avgRisk: responses.length
      ? Math.round(responses.reduce((a, b) => a + b.risk_score, 0) / responses.length)
      : 0,
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1.5rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Hallucination Firewall</h1>
          <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>Live audit explorer</p>
        </div>
        <span style={{
          fontSize: 12, padding: "4px 12px", borderRadius: 20,
          background: connected ? "#d1fae5" : "#fee2e2",
          color: connected ? "#065f46" : "#991b1b",
        }}>
          {connected ? "● Proxy connected" : "○ Demo mode"}
        </span>
      </div>

      <StatsBar stats={stats} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", marginTop: "1rem" }}>
        <div>
          <RiskChart responses={responses} />
          <ResponseLog responses={responses} selected={selected} onSelect={setSelected} />
        </div>
        <ClaimInspector response={selected} />
      </div>
    </div>
  );
}

// Demo data — shows dashboard fully without running proxy
const DEMO_DATA = [
  {
    request_id: "a1b2c3",
    risk_score: 82,
    action_taken: "BLOCK",
    rewritten: false,
    model: "gemini-2.0-flash",
    latency_ms: 430,
    original_answer: "Einstein invented the telephone in 1876 and also discovered gravity.",
    final_answer: "[BLOCKED] Response blocked — risk score 82/100.",
    flagged_claims: [
      { text: "Einstein invented the telephone in 1876", risk_score: 91, reason: "No supporting evidence found" },
      { text: "Einstein discovered gravity", risk_score: 78, reason: "Weak evidence — gravity predates Einstein" },
    ],
  },
  {
    request_id: "d4e5f6",
    risk_score: 55,
    action_taken: "WARN",
    rewritten: false,
    model: "gemini-2.0-flash",
    latency_ms: 380,
    original_answer: "The Python language was created by Guido van Rossum and released in 1992.",
    final_answer: "The Python language was created by Guido van Rossum and released in 1992.",
    flagged_claims: [
      { text: "Python was released in 1992", risk_score: 55, reason: "Partial evidence — actual release was 1991" },
    ],
  },
  {
    request_id: "g7h8i9",
    risk_score: 12,
    action_taken: "PASS",
    rewritten: false,
    model: "gemini-2.0-flash",
    latency_ms: 290,
    original_answer: "The Eiffel Tower is located in Paris, France and was built in 1889.",
    final_answer: "The Eiffel Tower is located in Paris, France and was built in 1889.",
    flagged_claims: [],
  },
  {
    request_id: "j1k2l3",
    risk_score: 67,
    action_taken: "REWRITE",
    rewritten: true,
    model: "gemini-2.0-flash",
    latency_ms: 890,
    original_answer: "Apollo 11 landed on Mars in 1969, piloted by Neil Armstrong.",
    final_answer: "Apollo 11 landed on the Moon in 1969. Neil Armstrong was the commander.",
    flagged_claims: [
      { text: "Apollo 11 landed on Mars", risk_score: 95, reason: "No supporting evidence — Apollo 11 landed on the Moon" },
    ],
  },
];
