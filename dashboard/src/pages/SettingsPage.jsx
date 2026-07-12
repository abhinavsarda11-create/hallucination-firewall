import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage({ user, onLogout, onClearAudit, auditCount }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [auditCleared, setAuditCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [cfg, setCfg] = useState({ action:"WARN",warn:40,block:75,rewrite:60,model:"llama-3.3-70b-versatile",neo4j:false,openai:true });
  const set = (k,v) => setCfg(c=>({...c,[k]:v}));

  const handleClearAudit = () => {
    if(confirmClear){ onClearAudit(); setAuditCleared(true); setConfirmClear(false); setTimeout(()=>setAuditCleared(false),2500); }
    else{ setConfirmClear(true); setTimeout(()=>setConfirmClear(false),3000); }
  };

  return (
    <div style={{ padding:"20px 16px",maxWidth:860 }}>
      <motion.div initial={{ opacity:0,y:-16 }} animate={{ opacity:1,y:0 }}>
        <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:"-.3px" }}>Settings</h1>
        <p style={{ fontSize:13,color:"#7d8590",marginTop:4 }}>Configure firewall behaviour, thresholds, and account</p>
      </motion.div>

      <div className="settings-grid-2" style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginTop:20 }}>
        {/* Account */}
        <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:.05 }}
          whileHover={{ borderColor:"#2a3347" }}
          style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:18,display:"flex",flexDirection:"column",gap:12,transition:"border-color .2s" }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#7d8590",textTransform:"uppercase",letterSpacing:".07em" }}>Account</div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <motion.div style={{ width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#7c6af7,#4f8ef0)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,flexShrink:0 }}
              whileHover={{ scale:1.1,rotate:5 }}>
              {user?.name?.[0]?.toUpperCase()}
            </motion.div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize:11,color:"#7d8590",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.email}</div>
            </div>
          </div>
          <motion.button onClick={()=>{ onLogout(); navigate("/login"); }}
            whileHover={{ scale:1.02,background:"rgba(240,79,95,.1)" }} whileTap={{ scale:0.98 }}
            style={{ background:"none",border:"1px solid rgba(240,79,95,.3)",color:"#f04f5f",padding:"8px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" }}>
            Sign out
          </motion.button>
        </motion.div>

        {/* Data */}
        <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1 }}
          whileHover={{ borderColor:"#2a3347" }}
          style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:18,display:"flex",flexDirection:"column",gap:10,transition:"border-color .2s" }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#7d8590",textTransform:"uppercase",letterSpacing:".07em" }}>Your data</div>
          {[{icon:"💾",label:"Audit log",desc:auditCount>0?`${auditCount} responses saved — persists across refreshes`:"No responses saved yet"},{icon:"🔑",label:"Storage",desc:"Saved in browser localStorage, tied to your email."}].map(d=>(
            <div key={d.label} style={{ display:"flex",gap:9,alignItems:"flex-start",paddingBottom:9,borderBottom:"1px solid #1e2535" }}>
              <span style={{ fontSize:16,flexShrink:0 }}>{d.icon}</span>
              <div><div style={{ fontSize:12,fontWeight:600,marginBottom:2 }}>{d.label}</div><div style={{ fontSize:11,color:"#7d8590",lineHeight:1.5 }}>{d.desc}</div></div>
            </div>
          ))}
          {auditCount>0&&(
            <motion.button onClick={handleClearAudit} whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              style={{ background:"none",border:`1px solid ${confirmClear?"rgba(240,79,95,.4)":"rgba(240,79,95,.2)"}`,color:"#f04f5f",padding:"7px",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" }}>
              {auditCleared?"✓ Cleared":confirmClear?"⚠ Confirm?": `Clear log (${auditCount})`}
            </motion.button>
          )}
        </motion.div>

        {/* Firewall */}
        <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:.15 }}
          whileHover={{ borderColor:"#2a3347" }}
          style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:18,display:"flex",flexDirection:"column",gap:12,transition:"border-color .2s" }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#7d8590",textTransform:"uppercase",letterSpacing:".07em" }}>Firewall</div>
          {[{key:"action",label:"Default action",opts:["WARN","BLOCK","REWRITE","PASS"]},{key:"model",label:"Model",opts:["llama-3.3-70b-versatile","llama3-70b-8192","mixtral-8x7b-32768"]}].map(f=>(
            <div key={f.key}>
              <label style={{ fontSize:11,color:"#7d8590",fontWeight:500,display:"block",marginBottom:5 }}>{f.label}</label>
              <select value={cfg[f.key]} onChange={e=>set(f.key,e.target.value)}
                style={{ background:"#161b27",border:"1px solid #1e2535",borderRadius:7,padding:"8px 12px",color:"#e6edf3",fontSize:13,outline:"none",width:"100%",fontFamily:"inherit" }}>
                {f.opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </motion.div>

        {/* Thresholds */}
        <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ delay:.2 }}
          whileHover={{ borderColor:"#2a3347" }}
          style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:18,display:"flex",flexDirection:"column",gap:14,transition:"border-color .2s" }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#7d8590",textTransform:"uppercase",letterSpacing:".07em" }}>Risk thresholds</div>
          {[{key:"warn",label:"Warn",color:"#f5a623"},{key:"block",label:"Block",color:"#f04f5f"},{key:"rewrite",label:"Rewrite",color:"#4f8ef0"}].map(t=>(
            <div key={t.key}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                <label style={{ fontSize:12,color:"#7d8590",fontWeight:500 }}>{t.label} threshold</label>
                <motion.span key={cfg[t.key]} initial={{ scale:1.3 }} animate={{ scale:1 }} style={{ fontSize:12,color:t.color,fontWeight:700 }}>{cfg[t.key]}/100</motion.span>
              </div>
              <div style={{ position:"relative",height:4,background:"#1e2535",borderRadius:4,marginBottom:4 }}>
                <motion.div animate={{ width:`${cfg[t.key]}%` }} transition={{ type:"spring",stiffness:300 }}
                  style={{ position:"absolute",top:0,left:0,height:"100%",background:t.color,borderRadius:4,opacity:.8 }}/>
              </div>
              <input type="range" min={0} max={100} value={cfg[t.key]} onChange={e=>set(t.key,Number(e.target.value))}
                style={{ width:"100%",accentColor:t.color }}/>
            </div>
          ))}
        </motion.div>
      </div>

      <div style={{ marginTop:16,display:"flex",gap:10 }}>
        <motion.button onClick={()=>{ setSaved(true); setTimeout(()=>setSaved(false),2000); }}
          whileHover={{ scale:1.03,boxShadow:"0 6px 20px rgba(124,106,247,0.4)" }} whileTap={{ scale:0.97 }}
          style={{ background:"linear-gradient(135deg,#7c6af7,#5b4fe0)",color:"#fff",border:"none",borderRadius:10,padding:"9px 22px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",minWidth:130 }}>
          <AnimatePresence mode="wait">
            {saved?<motion.span key="s" initial={{ opacity:0 }} animate={{ opacity:1 }}>✓ Saved!</motion.span>
              :<motion.span key="u" initial={{ opacity:0 }} animate={{ opacity:1 }}>Save settings</motion.span>}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
