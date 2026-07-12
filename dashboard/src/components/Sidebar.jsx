import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Home, MessageSquare, BarChart2, BookOpen, Info, Settings, LogOut, Zap, Activity } from "lucide-react";

const NAV = [
  { to:"/",       icon:Home,          label:"Home",      color:"#7c6af7" },
  { to:"/chat",   icon:MessageSquare, label:"Chat",      color:"#22d3a0" },
  { to:"/audit",  icon:BarChart2,     label:"Audit Log", color:"#f5a623" },
  { to:"/docs",   icon:BookOpen,      label:"Docs",      color:"#4f8ef0" },
  { to:"/about",  icon:Info,          label:"About",     color:"#22d3e0" },
  { to:"/settings",icon:Settings,     label:"Settings",  color:"#7d8590" },
];

export default function Sidebar({ user, onLogout, connected, auditCount }) {
  return (
    <motion.aside
      initial={{ x:-240,opacity:0 }} animate={{ x:0,opacity:1 }}
      transition={{ type:"spring",stiffness:300,damping:30 }}
      style={{ width:240,minWidth:240,background:"rgba(13,17,23,0.98)",backdropFilter:"blur(20px)",borderRight:"1px solid #1e2535",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflow:"hidden",zIndex:100 }}>

      {/* Logo */}
      <motion.div style={{ display:"flex",alignItems:"center",gap:10,padding:"20px 18px 18px",borderBottom:"1px solid #1e2535" }}
        initial={{ opacity:0,y:-20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}>
        <motion.div style={{ width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#7c6af7,#5b4fe0)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}
          animate={{ boxShadow:["0 0 10px rgba(124,106,247,0.3)","0 0 20px rgba(124,106,247,0.6)","0 0 10px rgba(124,106,247,0.3)"] }}
          transition={{ duration:3,repeat:Infinity }} whileHover={{ scale:1.1,rotate:5 }}>
          <Shield size={17} color="#fff" />
        </motion.div>
        <div>
          <div style={{ fontSize:13,fontWeight:700,letterSpacing:"-.2px" }}>HallucinationFirewall</div>
          <div style={{ fontSize:10,color:"#7d8590",fontFamily:"JetBrains Mono,monospace" }}>v3.0 · Groq Edition</div>
        </div>
      </motion.div>

      {/* Nav */}
      <nav style={{ flex:1,padding:"16px 10px",overflow:"auto",display:"flex",flexDirection:"column",gap:2 }}>
        <div style={{ fontSize:10,fontWeight:700,color:"#7d8590",letterSpacing:".1em",textTransform:"uppercase",padding:"0 8px 8px",marginTop:4 }}>Navigation</div>
        {NAV.map((n,i) => (
          <motion.div key={n.to} initial={{ opacity:0,x:-30 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.05+i*0.06,type:"spring",stiffness:300 }}>
            <NavLink to={n.to} end={n.to==="/"} className={({ isActive }) => `nav-item ${isActive?"active":""}`}>
              {({ isActive }) => (
                <>
                  <motion.div animate={{ color:isActive?n.color:"#7d8590",scale:isActive?1.1:1 }} transition={{ duration:.2 }}>
                    <n.icon size={15} />
                  </motion.div>
                  {n.label}
                  {n.to==="/audit" && auditCount>0 && (
                    <motion.span className="nav-badge" initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring",stiffness:500 }}>
                      {auditCount}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div layoutId="activeNav" style={{ position:"absolute",left:0,top:"15%",width:3,height:"70%",background:n.color,borderRadius:"0 3px 3px 0" }} transition={{ type:"spring",stiffness:400,damping:30 }} />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding:"14px 14px 18px",borderTop:"1px solid #1e2535",display:"flex",flexDirection:"column",gap:10 }}>
        <motion.div
          animate={{ backgroundColor:connected?"rgba(34,211,160,0.06)":"rgba(245,166,35,0.06)", borderColor:connected?"rgba(34,211,160,0.2)":"rgba(245,166,35,0.2)" }}
          style={{ display:"flex",alignItems:"center",gap:7,padding:"7px 10px",borderRadius:8,border:"1px solid",fontSize:11,fontWeight:500 }}>
          <motion.div animate={{ backgroundColor:connected?"#22d3a0":"#f5a623",boxShadow:connected?"0 0 8px #22d3a0":"0 0 8px #f5a623" }}
            style={{ width:7,height:7,borderRadius:"50%",flexShrink:0 }}
            animate2={{ scale:[1,1.3,1] }} transition={{ duration:2,repeat:Infinity }} />
          <motion.span animate={{ color:connected?"#22d3a0":"#f5a623" }}>
            {connected?"Proxy live":"Demo mode"}
          </motion.span>
        </motion.div>

        <motion.div style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"#161b27" }}
          whileHover={{ background:"#1e2535" }}>
          <motion.div style={{ width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#7c6af7,#4f8ef0)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}
            whileHover={{ scale:1.1,rotate:5 }}>
            {user?.name?.[0]?.toUpperCase()||"U"}
          </motion.div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.name}</div>
            <div style={{ fontSize:10,color:"#7d8590",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.email}</div>
          </div>
          <motion.button onClick={onLogout} whileHover={{ color:"#f04f5f",scale:1.1 }} style={{ background:"none",border:"none",color:"#7d8590",cursor:"pointer",flexShrink:0,display:"flex" }}>
            <LogOut size={14} />
          </motion.button>
        </motion.div>
      </div>
    </motion.aside>
  );
}
