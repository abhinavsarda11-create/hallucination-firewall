import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MessageSquare, BarChart2, BookOpen, Settings } from "lucide-react";

const TABS = [
  { to:"/",        icon:Home,          label:"Home"     },
  { to:"/chat",    icon:MessageSquare, label:"Chat"     },
  { to:"/audit",   icon:BarChart2,     label:"Audit"    },
  { to:"/docs",    icon:BookOpen,      label:"Docs"     },
  { to:"/settings",icon:Settings,      label:"Settings" },
];

export default function MobileNav({ auditCount }) {
  return (
    <nav className="mobile-bottom-nav">
      {TABS.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to==="/"} style={{ textDecoration:"none" }}>
          {({ isActive }) => (
            <motion.div className={`mobile-nav-btn ${isActive?"active-tab":""}`}
              whileTap={{ scale:0.85 }}>
              <div style={{ position:"relative" }}>
                <t.icon size={20} />
                {t.to==="/audit" && auditCount>0 && (
                  <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring",stiffness:500 }}
                    style={{ position:"absolute",top:-4,right:-4,width:14,height:14,borderRadius:"50%",background:"#7c6af7",color:"#fff",fontSize:8,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    {auditCount>9?"9+":auditCount}
                  </motion.div>
                )}
              </div>
              <span style={{ fontSize:9,fontWeight:isActive?600:400 }}>{t.label}</span>
              {isActive && (
                <motion.div layoutId="mobileActiveDot"
                  style={{ position:"absolute",bottom:-2,width:4,height:4,borderRadius:"50%",background:"#7c6af7" }} />
              )}
            </motion.div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
