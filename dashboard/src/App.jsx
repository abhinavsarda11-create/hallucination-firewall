import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import AuditPage from "./pages/AuditPage";
import AboutPage from "./pages/AboutPage";
import DocsPage from "./pages/DocsPage";
import SettingsPage from "./pages/SettingsPage";

const API_URL = import.meta.env.VITE_API_URL || "https://hallucination-firewall-production.up.railway.app";

function auditKey(user) { return `hf_audit_${user?.email || "guest"}`; }

const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  enter:   { opacity: 1, y: 0,  scale: 1,    transition: { type: "spring", stiffness: 280, damping: 28 } },
  exit:    { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.15 } },
};

function PageWrapper({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit">
      {children}
    </motion.div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("hf_user") || "null"); } catch { return null; }
  });
  const [connected, setConnected] = useState(false);
  const [auditLog, setAuditLog] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("hf_user") || "null");
      return JSON.parse(localStorage.getItem(auditKey(u)) || "[]");
    } catch { return []; }
  });

  useEffect(() => {
    if (!user) return;
    try { localStorage.setItem(auditKey(user), JSON.stringify(auditLog)); } catch {}
  }, [auditLog, user]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try { const r = await fetch(`${API_URL}/health`); setConnected(r.ok); }
      catch { setConnected(false); }
    }, 4000);
    return () => clearInterval(poll);
  }, []);

  const login = (u) => {
    setUser(u);
    try { setAuditLog(JSON.parse(localStorage.getItem(auditKey(u)) || "[]")); } catch { setAuditLog([]); }
  };
  const logout = () => {
    try { localStorage.removeItem("hf_user"); } catch {}
    setUser(null); setAuditLog([]);
  };
  const addToAudit = (e) => setAuditLog(p => [e, ...p]);
  const clearAudit = () => { setAuditLog([]); try { localStorage.removeItem(auditKey(user)); } catch {} };

  if (!user) return <LoginPage onLogin={login} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar user={user} onLogout={logout} connected={connected} auditCount={auditLog.length} />
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageWrapper><HomePage user={user} connected={connected} auditLog={auditLog} /></PageWrapper>} />
            <Route path="/chat" element={<ChatPage connected={connected} onNewResponse={addToAudit} apiUrl={API_URL} />} />
            <Route path="/audit" element={<PageWrapper><AuditPage auditLog={auditLog} onClear={clearAudit} /></PageWrapper>} />
            <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
            <Route path="/docs" element={<PageWrapper><DocsPage /></PageWrapper>} />
            <Route path="/settings" element={<PageWrapper><SettingsPage user={user} onLogout={logout} onClearAudit={clearAudit} auditCount={auditLog.length} /></PageWrapper>} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}
