import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import AuditPage from "./pages/AuditPage";
import AboutPage from "./pages/AboutPage";
import DocsPage from "./pages/DocsPage";
import SettingsPage from "./pages/SettingsPage";

const API_URL = import.meta.env.VITE_API_URL || "https://hallucination-firewall-production.up.railway.app";
function auditKey(u) { return `hf_audit_${u?.email || "guest"}`; }

const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  enter:   { opacity: 1, y: 0,  scale: 1, transition: { type: "spring", stiffness: 280, damping: 28 } },
  exit:    { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } },
};
function PageWrap({ children }) {
  return <motion.div variants={pageVariants} initial="initial" animate="enter" exit="exit">{children}</motion.div>;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Close sidebar on route change (mobile)
  const location = useLocation();
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

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
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* Hamburger button - mobile only */}
      <motion.button className="hamburger" onClick={() => setSidebarOpen(true)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </motion.button>

      {/* Sidebar overlay - mobile */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column", background: "rgba(13,17,23,0.98)", backdropFilter: "blur(20px)", borderRight: "1px solid #1e2535", position: "sticky", top: 0, height: "100vh", overflow: "hidden", zIndex: 100, minWidth: 240 }}>
        <Sidebar user={user} onLogout={logout} connected={connected} auditCount={auditLog.length} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="page-area" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageWrap><HomePage user={user} connected={connected} auditLog={auditLog} /></PageWrap>} />
            <Route path="/chat" element={<ChatPage connected={connected} onNewResponse={addToAudit} apiUrl={API_URL} />} />
            <Route path="/audit" element={<PageWrap><AuditPage auditLog={auditLog} onClear={clearAudit} /></PageWrap>} />
            <Route path="/about" element={<PageWrap><AboutPage /></PageWrap>} />
            <Route path="/docs" element={<PageWrap><DocsPage /></PageWrap>} />
            <Route path="/settings" element={<PageWrap><SettingsPage user={user} onLogout={logout} onClearAudit={clearAudit} auditCount={auditLog.length} /></PageWrap>} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav auditCount={auditLog.length} />
    </div>
  );
}
