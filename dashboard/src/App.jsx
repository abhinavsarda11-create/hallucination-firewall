import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import AuditPage from "./pages/AuditPage";
import AboutPage from "./pages/AboutPage";
import DocsPage from "./pages/DocsPage";
import SettingsPage from "./pages/SettingsPage";
import "./app.css";

function auditKey(user) {
  return `hf_audit_${user?.email || "guest"}`;
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("hf_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const [connected, setConnected] = useState(false);

  // Load audit log from localStorage for this user
  const [auditLog, setAuditLog] = useState(() => {
    try {
      const stored = localStorage.getItem(auditKey(
        JSON.parse(localStorage.getItem("hf_user") || "null")
      ));
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  // Persist audit log to localStorage whenever it changes
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(auditKey(user), JSON.stringify(auditLog));
    } catch (e) {
      console.warn("Could not save audit log:", e);
    }
  }, [auditLog, user]);

  // Poll proxy health
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const r = await fetch("http://localhost:8080/health");
        setConnected(r.ok);
      } catch { setConnected(false); }
    }, 4000);
    return () => clearInterval(poll);
  }, []);

  const login = (userData) => {
    setUser(userData);
    // Load that user's audit log from storage
    try {
      const stored = localStorage.getItem(auditKey(userData));
      setAuditLog(stored ? JSON.parse(stored) : []);
    } catch { setAuditLog([]); }
  };

  const logout = () => {
    try { localStorage.removeItem("hf_user"); } catch {}
    setUser(null);
    setAuditLog([]);
  };

  const addToAudit = (entry) => {
    setAuditLog(prev => [entry, ...prev]);
  };

  const clearAudit = () => {
    setAuditLog([]);
    try { localStorage.removeItem(auditKey(user)); } catch {}
  };

  if (!user) return <LoginPage onLogin={login} />;

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={logout} connected={connected} />
      <div className="page-area">
        <Routes>
          <Route path="/"        element={<HomePage user={user} connected={connected} auditLog={auditLog} />} />
          <Route path="/chat"    element={<ChatPage connected={connected} onNewResponse={addToAudit} />} />
          <Route path="/audit"   element={<AuditPage auditLog={auditLog} onClear={clearAudit} />} />
          <Route path="/about"   element={<AboutPage />} />
          <Route path="/docs"    element={<DocsPage />} />
          <Route path="/settings" element={<SettingsPage user={user} onLogout={logout} onClearAudit={clearAudit} auditCount={auditLog.length} />} />
          <Route path="/login"   element={<Navigate to="/" replace />} />
          <Route path="*"        element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}
