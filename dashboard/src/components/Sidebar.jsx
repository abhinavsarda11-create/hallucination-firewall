import { NavLink, useNavigate } from "react-router-dom";

const NAV = [
  { to: "/",        icon: "⊞", label: "Home" },
  { to: "/chat",    icon: "💬", label: "Chat" },
  { to: "/audit",   icon: "📊", label: "Audit Log" },
  { to: "/docs",    icon: "📄", label: "Docs" },
  { to: "/about",   icon: "ℹ",  label: "About" },
  { to: "/settings",icon: "⚙",  label: "Settings" },
];

export default function Sidebar({ user, onLogout, connected }) {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🛡</span>
        <div>
          <div className="logo-name">HallucinationFirewall</div>
          <div className="logo-version">v2.0 · Groq Edition</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Navigation</div>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`conn-badge ${connected ? "conn-ok" : "conn-off"}`}>
          <span className="conn-dot" />
          {connected ? "Proxy live" : "Demo mode"}
        </div>
        <div className="user-row">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || "User"}</div>
            <div className="user-email">{user?.email || ""}</div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Sign out">↩</button>
        </div>
      </div>
    </aside>
  );
}
