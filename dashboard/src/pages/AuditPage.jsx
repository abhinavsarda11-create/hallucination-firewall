import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from "recharts";
import StatsBar from "../components/StatsBar";
import ResponseLog from "../components/ResponseLog";
import ClaimInspector from "../components/ClaimInspector";

const CustomTooltip = ({ active, payload }) => {
  if (!active||!payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background:"#161b27",border:"1px solid #1e2535",borderRadius:8,padding:"10px 14px",fontSize:12 }}>
      <div style={{ color:"#7d8590" }}>#{d?.index}</div>
      <div style={{ color:"#e6edf3",fontWeight:600 }}>Risk: {payload[0]?.value}/100</div>
      <div style={{ color:"#7d8590" }}>{d?.action}</div>
    </div>
  );
};

export default function AuditPage({ auditLog, onClear }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [confirmClear, setConfirmClear] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  const filtered = filter==="ALL"?auditLog:auditLog.filter(r=>r.action_taken===filter);
  const stats = {
    total:auditLog.length,
    flagged:auditLog.filter(r=>r.risk_score>=40).length,
    blocked:auditLog.filter(r=>r.action_taken==="BLOCK").length,
    rewritten:auditLog.filter(r=>r.rewritten).length,
    avgRisk:auditLog.length?Math.round(auditLog.reduce((a,b)=>a+b.risk_score,0)/auditLog.length):0,
  };
  const chartData = [...auditLog].reverse().map((r,i)=>({ index:i+1,risk:Math.round(r.risk_score),action:r.action_taken,_r:r }));

  const handleSelect = (r) => {
    setSelected(r);
    setShowInspector(true);
  };

  const handleClear = () => {
    if(confirmClear){ onClear(); setSelected(null); setConfirmClear(false); }
    else{ setConfirmClear(true); setTimeout(()=>setConfirmClear(false),3000); }
  };

  if(!auditLog.length) return (
    <div style={{ padding:"24px 20px" }}>
      <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:"-.3px",marginBottom:4 }}>Audit Log</h1>
      <p style={{ fontSize:13,color:"#7d8590",marginBottom:32 }}>Every intercepted response with full claim inspection</p>
      <motion.div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"60px 20px",textAlign:"center" }}
        initial={{ opacity:0,y:24 }} animate={{ opacity:1,y:0 }}>
        <motion.div style={{ fontSize:52,opacity:.3 }} animate={{ y:[0,-8,0],rotate:[0,5,-5,0] }} transition={{ duration:3,repeat:Infinity }}>📭</motion.div>
        <div style={{ fontSize:20,fontWeight:600 }}>No responses yet</div>
        <div style={{ fontSize:13,color:"#7d8590",maxWidth:340,lineHeight:1.7 }}>Go to Chat and ask a question — every response will appear here with full hallucination analysis.</div>
        <motion.button onClick={()=>navigate("/chat")}
          whileHover={{ scale:1.04,boxShadow:"0 8px 24px rgba(124,106,247,0.4)" }} whileTap={{ scale:0.97 }}
          style={{ background:"linear-gradient(135deg,#7c6af7,#5b4fe0)",color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          Go to Chat →
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding:"20px 16px" }}>
      {/* Header */}
      <motion.div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10 }}
        initial={{ opacity:0,y:-16 }} animate={{ opacity:1,y:0 }}>
        <div>
          <h1 style={{ fontSize:20,fontWeight:700,letterSpacing:"-.3px" }}>Audit Log</h1>
          <p style={{ fontSize:12,color:"#7d8590",marginTop:3,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
            {auditLog.length} response{auditLog.length!==1?"s":""} intercepted
            <motion.span initial={{ opacity:0,scale:0 }} animate={{ opacity:1,scale:1 }} transition={{ delay:.3 }}
              style={{ display:"inline-flex",alignItems:"center",gap:3,fontSize:10,color:"#22d3a0",background:"rgba(34,211,160,.08)",border:"1px solid rgba(34,211,160,.2)",borderRadius:20,padding:"1px 7px" }}>
              💾 Saved
            </motion.span>
          </p>
        </div>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
          <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
            {["ALL","BLOCK","WARN","PASS"].map(f=>(
              <motion.button key={f} onClick={()=>setFilter(f)}
                whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                style={{ background:filter===f?"rgba(124,106,247,.12)":"none",border:filter===f?"1px solid rgba(124,106,247,.3)":"1px solid #1e2535",color:filter===f?"#7c6af7":"#7d8590",padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s" }}>
                {f}
              </motion.button>
            ))}
          </div>
          <motion.button onClick={handleClear} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            style={{ background:"none",border:confirmClear?"1px solid rgba(240,79,95,.4)":"1px solid #2a3347",color:confirmClear?"#f04f5f":"#7d8590",padding:"4px 12px",borderRadius:8,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" }}>
            {confirmClear?"⚠ Confirm?":"Clear"}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats - responsive grid */}
      <div className="stats-grid-5">
        <StatsBar stats={stats}/>
      </div>

      {/* Main layout - stacks on mobile */}
      <div className="audit-layout" style={{ display:"grid",gridTemplateColumns:"1fr 300px",gap:0,border:"1px solid #1e2535",borderRadius:12,background:"#0d1117",overflow:"hidden",maxHeight:"calc(100vh - 280px)" }}>
        <div style={{ overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:12,borderRight:"1px solid #1e2535" }}>
          {/* Chart */}
          <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1 }}
            style={{ background:"#161b27",border:"1px solid #1e2535",borderRadius:10,padding:"14px 16px" }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#7d8590",textTransform:"uppercase",letterSpacing:".07em",marginBottom:12 }}>📈 Risk trend</div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData} margin={{ top:4,right:8,bottom:0,left:-18 }}
                onClick={e=>e?.activePayload&&handleSelect(e.activePayload[0]?.payload?._r)}>
                <defs>
                  <linearGradient id="rg3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" vertical={false}/>
                <XAxis dataKey="index" tick={{ fontSize:11,fill:"#7d8590" }} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{ fontSize:11,fill:"#7d8590" }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <ReferenceLine y={75} stroke="#f04f5f" strokeDasharray="3 3" strokeOpacity={0.5}/>
                <ReferenceLine y={40} stroke="#f5a623" strokeDasharray="3 3" strokeOpacity={0.5}/>
                <Area type="monotone" dataKey="risk" stroke="#7c6af7" strokeWidth={2} fill="url(#rg3)"
                  dot={{ r:3,fill:"#7c6af7",strokeWidth:0 }} activeDot={{ r:5,fill:"#7c6af7",stroke:"#080b12",strokeWidth:2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <ResponseLog responses={filtered} selected={selected} onSelect={handleSelect}/>
        </div>

        {/* Inspector - hidden on mobile, shown as sheet */}
        <div className="audit-right-panel" style={{ overflowY:"auto" }}>
          <ClaimInspector response={selected}/>
        </div>
      </div>

      {/* Mobile inspector sheet */}
      <AnimatePresence>
        {showInspector && selected && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={()=>setShowInspector(false)}
              style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"none" }}
              className="mobile-inspector-overlay" />
            <motion.div
              initial={{ y:"100%" }} animate={{ y:0 }} exit={{ y:"100%" }}
              transition={{ type:"spring",stiffness:300,damping:30 }}
              style={{ position:"fixed",bottom:0,left:0,right:0,zIndex:301,background:"#0d1117",border:"1px solid #1e2535",borderRadius:"20px 20px 0 0",maxHeight:"80vh",overflowY:"auto",display:"none" }}
              className="mobile-inspector-sheet">
              <div style={{ padding:"12px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ width:40,height:4,borderRadius:2,background:"#2a3347",margin:"0 auto" }}/>
              </div>
              <button onClick={()=>setShowInspector(false)}
                style={{ position:"absolute",top:14,right:14,background:"none",border:"none",color:"#7d8590",cursor:"pointer",fontSize:18 }}>✕</button>
              <ClaimInspector response={selected}/>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
