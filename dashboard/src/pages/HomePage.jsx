import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Zap, BarChart2, RefreshCw, AlertTriangle, XCircle, ArrowRight, TrendingUp, Brain, Lock } from "lucide-react";

const container = { hidden:{}, show:{ transition:{ staggerChildren:0.08 } } };
const item = { hidden:{ opacity:0,y:30 }, show:{ opacity:1,y:0,transition:{ type:"spring",stiffness:300,damping:25 } } };

const FEATURES = [
  { icon:"🔍", title:"Claim extraction", desc:"Groq pulls every verifiable factual claim from LLM responses using llama-3.3-70b.", color:"#7c6af7", bg:"rgba(124,106,247,.08)" },
  { icon:"🧠", title:"AI verification", desc:"Each claim verified by Groq's world knowledge — works for any topic, no database needed.", color:"#22d3a0", bg:"rgba(34,211,160,.08)" },
  { icon:"📊", title:"Risk scoring", desc:"Responses get a 0–100 hallucination risk score with per-claim breakdowns.", color:"#4f8ef0", bg:"rgba(79,142,240,.08)" },
  { icon:"⚡", title:"Auto-rewrite", desc:"High-risk responses automatically corrected by Groq before reaching users.", color:"#f5a623", bg:"rgba(245,166,35,.08)" },
  { icon:"🛡", title:"Block & warn", desc:"Configure thresholds to block or warn on dangerous responses in real time.", color:"#f04f5f", bg:"rgba(240,79,95,.08)" },
  { icon:"📋", title:"Audit log", desc:"Full history of every intercepted response, saved per user across sessions.", color:"#22d3e0", bg:"rgba(34,211,224,.08)" },
];

function CountUp({ end, duration = 1.5 }) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (end === 0) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 1000/60);
    return () => clearInterval(timer);
  }, [end]);
  return val;
}

import React from "react";

export default function HomePage({ user, connected, auditLog }) {
  const navigate = useNavigate();
  const stats = {
    total: auditLog.length,
    blocked: auditLog.filter(r => r.action_taken === "BLOCK").length,
    avgRisk: auditLog.length ? Math.round(auditLog.reduce((a,b) => a+b.risk_score,0)/auditLog.length) : 0,
  };

  return (
    <div style={{ padding:"28px 32px",maxWidth:1200 }}>
      {/* Hero */}
      <motion.div style={{ paddingBottom:36,borderBottom:"1px solid #1e2535",marginBottom:28,position:"relative",overflow:"hidden" }}>
        {/* Grid bg */}
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(124,106,247,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,247,.03) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none" }} />

        {/* Floating blobs */}
        {[{ x:"80%",y:"20%",c:"rgba(124,106,247,0.06)",s:200 },{ x:"90%",y:"70%",c:"rgba(34,211,160,0.04)",s:150 }].map((b,i) => (
          <motion.div key={i} style={{ position:"absolute",left:b.x,top:b.y,width:b.s,height:b.s,borderRadius:"50%",background:`radial-gradient(circle,${b.c} 0%,transparent 70%)`,pointerEvents:"none",transform:"translate(-50%,-50%)" }}
            animate={{ scale:[1,1.4,1],x:[0,20,0] }} transition={{ duration:6+i*2,repeat:Infinity,ease:"easeInOut" }} />
        ))}

        <motion.div initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} transition={{ type:"spring",stiffness:200 }}>
          <motion.div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(124,106,247,0.08)",border:"1px solid rgba(124,106,247,0.2)",borderRadius:20,padding:"4px 14px",fontSize:11,color:"#7c6af7",fontWeight:600,letterSpacing:".04em",marginBottom:20 }}
            animate={{ boxShadow:["0 0 0 rgba(124,106,247,0)","0 0 20px rgba(124,106,247,0.2)","0 0 0 rgba(124,106,247,0)"] }}
            transition={{ duration:2,repeat:Infinity }}>
            <motion.div style={{ width:6,height:6,borderRadius:"50%",background:"#22d3a0" }} animate={{ scale:[1,1.3,1] }} transition={{ duration:1.5,repeat:Infinity }} />
            {connected ? "Connected to Railway backend" : "Demo mode — deploy backend to activate"}
          </motion.div>

          <motion.h1 style={{ fontSize:36,fontWeight:800,letterSpacing:"-.6px",lineHeight:1.15,marginBottom:14 }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋<br />
            <motion.span style={{ background:"linear-gradient(135deg,#7c6af7,#22d3a0)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}
              animate={{ backgroundPosition:["0% 50%","100% 50%","0% 50%"] }} transition={{ duration:4,repeat:Infinity }}>
              Stop hallucinations
            </motion.span>{" "}before they reach users.
          </motion.h1>

          <p style={{ fontSize:15,color:"#7d8590",maxWidth:560,lineHeight:1.7,marginBottom:24 }}>
            Every Groq response is intercepted, verified, and scored in real time using AI. No static knowledge base required.
          </p>

          <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
            <motion.button onClick={() => navigate("/chat")}
              whileHover={{ scale:1.04,boxShadow:"0 8px 30px rgba(124,106,247,0.5)" }} whileTap={{ scale:0.97 }}
              style={{ background:"linear-gradient(135deg,#7c6af7,#5b4fe0)",color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"inherit",boxShadow:"0 4px 20px rgba(124,106,247,0.35)" }}>
              Open Chat <motion.span animate={{ x:[0,4,0] }} transition={{ duration:1.5,repeat:Infinity }}><ArrowRight size={14}/></motion.span>
            </motion.button>
            <motion.button onClick={() => navigate("/audit")}
              whileHover={{ scale:1.04,borderColor:"#7c6af7",color:"#7c6af7" }} whileTap={{ scale:0.97 }}
              style={{ background:"none",border:"1px solid #2a3347",color:"#e6edf3",borderRadius:10,padding:"10px 22px",fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" }}>
              View Audit {auditLog.length > 0 && `(${auditLog.length})`}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28 }}
        variants={container} initial="hidden" animate="show">
        {[
          { icon:Shield,  label:"Model",             value:"llama-3.3-70b", color:"#7c6af7", bg:"rgba(124,106,247,.08)" },
          { icon:AlertTriangle, label:"Warn threshold", value:"≥ 40",  color:"#f5a623", bg:"rgba(245,166,35,.08)" },
          { icon:XCircle, label:"Block threshold",    value:"≥ 75",         color:"#f04f5f", bg:"rgba(240,79,95,.08)" },
          { icon:BarChart2,label:"Responses checked", value:stats.total,    color:"#22d3a0", bg:"rgba(34,211,160,.08)" },
        ].map((s,i) => (
          <motion.div key={s.label} variants={item}
            whileHover={{ y:-4,boxShadow:"0 12px 30px rgba(0,0,0,0.3)",borderColor:"#2a3347" }}
            style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:"16px 18px",display:"flex",alignItems:"center",gap:14,cursor:"default",transition:"border-color .2s" }}>
            <motion.div style={{ width:38,height:38,borderRadius:9,background:s.bg,color:s.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}
              whileHover={{ rotate:10,scale:1.1 }}>
              <s.icon size={17} />
            </motion.div>
            <div>
              <div style={{ fontSize:typeof s.value==="number"?24:17,fontWeight:700,color:s.color,lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11,color:"#7d8590",marginTop:3 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Features */}
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7d8590",marginBottom:14 }}>Core capabilities</div>
      <motion.div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}
        variants={container} initial="hidden" animate="show">
        {FEATURES.map(f => (
          <motion.div key={f.title} variants={item}
            whileHover={{ y:-6,boxShadow:"0 16px 40px rgba(0,0,0,0.35)",borderColor:"#2a3347" }}
            style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:20,transition:"border-color .2s,box-shadow .2s" }}>
            <motion.div style={{ width:40,height:40,borderRadius:10,background:f.bg,color:f.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:14 }}
              whileHover={{ rotate:10,scale:1.15 }}>
              {f.icon}
            </motion.div>
            <div style={{ fontSize:14,fontWeight:600,marginBottom:6 }}>{f.title}</div>
            <div style={{ fontSize:12,color:"#7d8590",lineHeight:1.7 }}>{f.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent */}
      {auditLog.length > 0 && (
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:.4 }}>
          <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7d8590",margin:"28px 0 12px" }}>Recent activity</div>
          <div style={{ border:"1px solid #1e2535",borderRadius:12,overflow:"hidden",background:"#0d1117" }}>
            {auditLog.slice(0,3).map((r,i) => {
              const rc = r.risk_score>=70?"#f04f5f":r.risk_score>=40?"#f5a623":"#22d3a0";
              const rbg = r.risk_score>=70?"rgba(240,79,95,.1)":r.risk_score>=40?"rgba(245,166,35,.08)":"rgba(34,211,160,.08)";
              return (
                <motion.div key={r.request_id} onClick={() => navigate("/audit")}
                  initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*.07 }}
                  whileHover={{ backgroundColor:"#161b27" }}
                  style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:i<2?"1px solid #1e2535":"none",cursor:"pointer" }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:rbg,color:rc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,boxShadow:`0 0 0 1.5px ${rbg}`,flexShrink:0 }}>
                    {Math.round(r.risk_score)}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.original_answer}</div>
                    <div style={{ fontSize:10,color:"#7d8590",marginTop:2,fontFamily:"JetBrains Mono,monospace" }}>{r.request_id} · {r.flagged_claims?.length} flagged</div>
                  </div>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:rbg,color:rc,border:`1px solid ${rbg}`,flexShrink:0 }}>{r.action_taken}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
