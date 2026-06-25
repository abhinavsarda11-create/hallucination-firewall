import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (tab === "signup" && !name.trim()) {
      setError("Full name is required.");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 700));

    const userData = {
      name: name.trim() || email.split("@")[0],
      email: email.trim(),
    };

    try {
      localStorage.setItem("hf_user", JSON.stringify(userData));
    } catch (_) {}

    onLogin(userData);
  };

  const onKey = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="login-bg">
      <div className="login-glow" />
      <div className="login-card">
        <div className="login-logo">
          <span style={{ fontSize: 36 }}>🛡</span>
          <h1 className="login-title">HallucinationFirewall</h1>
          <p className="login-sub">AI response security powered by Groq</p>
        </div>

        <div className="tab-row">
          <button
            type="button"
            className={`tab-btn ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`tab-btn ${tab === "signup" ? "active" : ""}`}
            onClick={() => { setTab("signup"); setError(""); }}
          >
            Create account
          </button>
        </div>

        <div className="login-form">
          {tab === "signup" && (
            <div className="field-group">
              <label className="field-label">Full name</label>
              <input
                className="field-input"
                placeholder="Abhinav Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={onKey}
                autoFocus
              />
            </div>
          )}

          <div className="field-group">
            <label className="field-label">Email address</label>
            <input
              className="field-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={onKey}
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={onKey}
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="button"
            className="login-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? <span className="spin">↻</span>
              : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </div>

        <p className="login-hint">Demo: enter any email + password to continue</p>
      </div>
    </div>
  );
}
