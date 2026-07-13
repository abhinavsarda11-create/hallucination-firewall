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
  initial: { opacity: 0, y: 14, scale: 0.98 },
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
  const location = useLocation();

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
    <div style={{ display:"flex", minHeight:"100vh", background:"#080b12", color:"#e6edf3", fontFamily:"Inter,system-ui,sans-serif", position:"relative" }}>

      {/* Hamburger - mobile only */}
      <button onClick={() => setSidebarOpen(true)}
        style={{ display:"none", position:"fixed", top:12, left:12, zIndex:300, width:36, height:36, borderRadius:8, background:"#161b27", border:"1px solid #1e2535", color:"#e6edf3", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 }}
        id="hamburger-btn">
        ☰
      </button>

      {/* Overlay - mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:150, backdropFilter:"blur(4px)" }} />
      )}

      {/* Sidebar */}
      <div id="main-sidebar"
        style={{ width:240, minWidth:240, background:"rgba(13,17,23,0.98)", backdropFilter:"blur(20px)", borderRight:"1px solid #1e2535", display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflow:"hidden", zIndex:100, flexShrink:0 }}>
        <Sidebar user={user} onLogout={logout} connected={connected} auditCount={auditLog.length} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Page area */}
      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", minWidth:0 }}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/"        element={<PageWrap><HomePage user={user} connected={connected} auditLog={auditLog}/></PageWrap>} />
            <Route path="/chat"    element={<ChatPage connected={connected} onNewResponse={addToAudit} apiUrl={API_URL}/>} />
            <Route path="/audit"   element={<PageWrap><AuditPage auditLog={auditLog} onClear={clearAudit}/></PageWrap>} />
            <Route path="/about"   element={<PageWrap><AboutPage/></PageWrap>} />
            <Route path="/docs"    element={<PageWrap><DocsPage/></PageWrap>} />
            <Route path="/settings" element={<PageWrap><SettingsPage user={user} onLogout={logout} onClearAudit={clearAudit} auditCount={auditLog.length}/></PageWrap>} />
            <Route path="/login"   element={<Navigate to="/" replace/>} />
            <Route path="*"        element={<Navigate to="/" replace/>} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav auditCount={auditLog.length} />

      {/* Responsive styles injected here */}
      <style>{`
        @media (max-width: 768px) {
          #hamburger-btn { display: flex !important; }
          #main-sidebar {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            transform: ${sidebarOpen ? "translateX(0)" : "translateX(-100%)"};
            transition: transform 0.3s ease;
            z-index: 200;
            width: 260px !important;
            min-width: 260px !important;
          }
          .mobile-bottom-nav { display: flex !important; }
          .page-content { padding-bottom: 72px !important; }
          .quick-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .settings-grid-2 { grid-template-columns: 1fr !important; }
          .audit-side-panel { display: none !important; }
          .audit-grid-layout { grid-template-columns: 1fr !important; max-height: none !important; }
          .hero-title { font-size: 22px !important; }
          .team-grid-2 { grid-template-columns: 1fr !important; }
          .docs-actions-grid { grid-template-columns: 1fr !important; }
          .chat-header-stats { display: none !important; }
        }
        @media (max-width: 480px) {
          .quick-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-title { font-size: 19px !important; }
        }
      `}</style>
    </div>
  );
}
