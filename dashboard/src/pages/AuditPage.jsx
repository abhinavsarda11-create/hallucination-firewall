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
    <motion.div initial={{ opacity:0,scale:0.9 }} animate={{ opacity:1,scale:1 }}
      style={{ background:"#161b27",border:"1px solid #1e2535",borderRadius:8,padding:"10px 14px",fontSize:12 }}>
      <div style={{ color:"#7d8590" }}>#{d?.index}</div>
      <div style={{ color:"#e6edf3",fontWeight:600 }}>Risk: {payload[0]?.value}/100</div>
      <div style={{ color:"#7d8590" }}>{d?.action}</div>
    </motion.div>
  );
};

export default function AuditPage({ auditLog, onClear }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = filter==="ALL"?auditLog:auditLog.filter(r=>r.action_taken===filter);
  const stats = {
    total:auditLog.length, flagged:auditLog.filter(r=>r.risk_score>=40).length,
    blocked:auditLog.filter(r=>r.action_taken==="BLOCK").length,
    rewritten:auditLog.filter(r=>r.rewritten).length,
    avgRisk:auditLog.length?Math.round(auditLog.reduce((a,b)=>a+b.risk_score,0)/auditLog.length):0,
  };
  const chartData = [...auditLog].reverse().map((r,i)=>({ index:i+1,risk:Math.round(r.risk_score),action:r.action_taken,_r:r }));

  const handleClear = () => {
    if (confirmClear) { onClear(); setSelected(null); setConfirmClear(false); }
    else { setConfirmClear(true); setTimeout(()=>setConfirmClear(false),3000); }
  };

  if (!auditLog.length) return (
    <div style={{ padding:"28px 32px" }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24 }}>
        <div><h1 style={{ fontSize:24,fontWeight:700,letterSpacing:"-.4px" }}>Audit Log</h1><p style={{ fontSize:13,color:"#7d8590",marginTop:4 }}>Every intercepted response with full claim inspection</p></div>
      </div>
      <motion.div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"80px 20px",textAlign:"center" }}
        initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }}>
        <motion.div style={{ fontSize:56,opacity:.3 }} animate={{ y:[0,-8,0],rotate:[0,5,-5,0] }} transition={{ duration:3,repeat:Infinity }}>📭</motion.div>
        <div style={{ fontSize:20,fontWeight:600 }}>No responses yet</div>
        <div style={{ fontSize:13,color:"#7d8590",maxWidth:380,lineHeight:1.7 }}>Go to Chat and ask a question — every response will appear here with full hallucination analysis.</div>
        <motion.button onClick={()=>navigate("/chat")}
          whileHover={{ scale:1.05,boxShadow:"0 8px 25px rgba(124,106,247,0.4)" }} whileTap={{ scale:0.97 }}
          style={{ background:"linear-gradient(135deg,#7c6af7,#5b4fe0)",color:"#fff",border:"none",borderRadius:10,padding:"10px 22px",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
          Go to Chat →
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding:"20px 24px" }}>
      <motion.div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}
        initial={{ opacity:0,y:-20 }} animate={{ opacity:1,y:0 }}>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:"-.3px" }}>Audit Log</h1>
          <p style={{ fontSize:13,color:"#7d8590",marginTop:3,display:"flex",alignItems:"center",gap:8 }}>
            {auditLog.length} response{auditLog.length!==1?"s":""} intercepted
            <motion.span initial={{ opacity:0,scale:0 }} animate={{ opacity:1,scale:1 }} transition={{ delay:.3 }}
              style={{ display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:"#22d3a0",background:"rgba(34,211,160,.08)",border:"1px solid rgba(34,211,160,.2)",borderRadius:20,padding:"1px 8px" }}>
              💾 Saved
            </motion.span>
          </p>
        </div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
          {["ALL","BLOCK","WARN","REWRITE","PASS"].map(f=>(
            <motion.button key={f} onClick={()=>setFilter(f)}
              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              style={{ background:filter===f?"rgba(124,106,247,.12)":"none",border:filter===f?"1px solid rgba(124,106,247,.3)":"1px solid #1e2535",color:filter===f?"#7c6af7":"#7d8590",padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s" }}>
              {f}
            </motion.button>
          ))}
          <motion.button onClick={handleClear} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            style={{ background:"none",border:confirmClear?"1px solid rgba(240,79,95,.4)":"1px solid #2a3347",color:confirmClear?"#f04f5f":"#7d8590",padding:"5px 14px",borderRadius:8,fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all .2s" }}>
            {confirmClear?"⚠ Confirm?":"Clear"}
          </motion.button>
        </div>
      </motion.div>

      <StatsBar stats={stats} />

      <div style={{ display:"grid",gridTemplateColumns:"1fr 320px",height:"calc(100vh - 200px)",overflow:"hidden",border:"1px solid #1e2535",borderRadius:12,background:"#0d1117" }}>
        <div style={{ overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:14,borderRight:"1px solid #1e2535" }}>
          {/* Chart */}
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1 }}
            style={{ background:"#161b27",border:"1px solid #1e2535",borderRadius:12,padding:"16px 18px" }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#7d8590",textTransform:"uppercase",letterSpacing:".07em",marginBottom:14 }}>📈 Risk score trend</div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top:4,right:8,bottom:0,left:-18 }}
                onClick={e=>e?.activePayload&&setSelected(e.activePayload[0]?.payload?._r)}>
                <defs>
                  <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="risk" stroke="#7c6af7" strokeWidth={2} fill="url(#rg2)"
                  dot={{ r:4,fill:"#7c6af7",strokeWidth:0 }} activeDot={{ r:6,fill:"#7c6af7",stroke:"#080b12",strokeWidth:2 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
          <ResponseLog responses={filtered} selected={selected} onSelect={setSelected}/>
        </div>
        <div style={{ overflowY:"auto" }}>
          <ClaimInspector response={selected}/>
        </div>
      </div>
    </div>
  );
}
