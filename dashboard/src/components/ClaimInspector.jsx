import { motion, AnimatePresence } from "framer-motion";
const riskColor = s => s>=70?"#f04f5f":s>=40?"#f5a623":"#22d3a0";
const riskBg = s => s>=70?"rgba(240,79,95,.08)":s>=40?"rgba(245,166,35,.06)":"rgba(34,211,160,.06)";
const riskRing = s => s>=70?"rgba(240,79,95,.3)":s>=40?"rgba(245,166,35,.3)":"rgba(34,211,160,.25)";

export default function ClaimInspector({ response }) {
  if (!response) return (
    <div style={{ padding:20,height:"100%",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10 }}>
      <motion.div style={{ fontSize:36,opacity:.3 }} animate={{ y:[0,-6,0] }} transition={{ duration:2,repeat:Infinity }}>🔍</motion.div>
      <div style={{ fontSize:13,color:"#7d8590" }}>Select a response to inspect</div>
    </div>
  );

  const { original_answer,final_answer,risk_score,action_taken,flagged_claims,rewritten,latency_ms,model,request_id } = response;
  const s = Math.round(risk_score);

  return (
    <motion.div style={{ padding:20,display:"flex",flexDirection:"column",gap:16 }}
      initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} transition={{ type:"spring",stiffness:300 }}>

      {/* Header */}
      <div style={{ borderBottom:"1px solid #1e2535",paddingBottom:14 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontSize:13,fontWeight:600 }}>Claim Inspector</div>
          <motion.span whileHover={{ scale:1.05 }}
            style={{ fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,
              background:action_taken==="BLOCK"?"rgba(240,79,95,.12)":action_taken==="WARN"?"rgba(245,166,35,.1)":action_taken==="REWRITE"?"rgba(79,142,240,.1)":"rgba(34,211,160,.08)",
              color:action_taken==="BLOCK"?"#f04f5f":action_taken==="WARN"?"#f5a623":action_taken==="REWRITE"?"#4f8ef0":"#22d3a0",
              border:`1px solid ${action_taken==="BLOCK"?"rgba(240,79,95,.2)":action_taken==="WARN"?"rgba(245,166,35,.2)":action_taken==="REWRITE"?"rgba(79,142,240,.2)":"rgba(34,211,160,.15)"}` }}>
            {action_taken}
          </motion.span>
        </div>
        <div style={{ fontSize:10,color:"#7d8590",fontFamily:"JetBrains Mono,monospace",marginTop:3 }}>
          {model} · {request_id} · {Math.round(latency_ms)}ms
        </div>
      </div>

      {/* Risk dial */}
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:8 }}>
        <motion.div
          style={{ width:88,height:88,borderRadius:"50%",background:riskBg(s),boxShadow:`0 0 0 2px ${riskRing(s)}, 0 0 20px ${riskBg(s)}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:riskColor(s),fontWeight:700 }}
          initial={{ scale:0,rotate:-180 }} animate={{ scale:1,rotate:0 }}
          transition={{ type:"spring",stiffness:300,damping:20 }}>
          <motion.span style={{ fontSize:26,lineHeight:1 }} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>{s}</motion.span>
          <span style={{ fontSize:10,opacity:.7 }}>/ 100</span>
        </motion.div>

        {/* Risk bar */}
        <div style={{ width:"80%",height:4,background:"#1e2535",borderRadius:4,overflow:"hidden" }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${s}%` }} transition={{ duration:1,ease:"easeOut",delay:0.2 }}
            style={{ height:"100%",background:`linear-gradient(90deg,#22d3a0,${s>=70?"#f04f5f":s>=40?"#f5a623":"#22d3a0"})`,borderRadius:4 }} />
        </div>
        <span style={{ fontSize:11,color:"#7d8590" }}>Hallucination risk</span>
      </div>

      {/* Original */}
      <div>
        <div style={{ fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7d8590",marginBottom:6 }}>Original response</div>
        <motion.div whileHover={{ borderColor:"#2a3347" }}
          style={{ fontSize:12,lineHeight:1.7,padding:"10px 13px",borderRadius:8,background:"#161b27",border:"1px solid #1e2535",transition:"border-color .2s" }}>
          {original_answer}
        </motion.div>
      </div>

      {/* Rewritten */}
      {rewritten&&(
        <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }}>
          <div style={{ fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#4f8ef0",marginBottom:6 }}>↻ Auto-rewritten</div>
          <div style={{ fontSize:12,lineHeight:1.7,padding:"10px 13px",borderRadius:8,background:"rgba(79,142,240,.06)",border:"1px solid rgba(79,142,240,.2)",color:"#4f8ef0" }}>
            {final_answer}
          </div>
        </motion.div>
      )}

      {/* Claims */}
      <div>
        <div style={{ fontSize:10,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7d8590",marginBottom:6 }}>
          Flagged claims ({flagged_claims?.length||0})
        </div>
        {!flagged_claims?.length ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ fontSize:12,color:"#22d3a0",display:"flex",alignItems:"center",gap:6 }}>
            <motion.span animate={{ scale:[1,1.2,1] }} transition={{ duration:1,repeat:3 }}>✓</motion.span>
            No claims flagged — response appears accurate.
          </motion.div>
        ) : (
          <AnimatePresence>
            {flagged_claims.map((c,i) => (
              <motion.div key={i}
                initial={{ opacity:0,y:10,x:-10 }} animate={{ opacity:1,y:0,x:0 }} transition={{ delay:i*0.07,type:"spring" }}
                whileHover={{ x:3 }}
                style={{ borderRadius:8,padding:"10px 12px",marginBottom:6,border:"1px solid rgba(240,79,95,.15)",background:"rgba(240,79,95,.05)" }}>
                <div style={{ fontSize:12,color:"#f04f5f",fontStyle:"italic",marginBottom:4 }}>"{c.text}"</div>
                <div style={{ fontSize:11,color:"#7d8590" }}>{c.reason}</div>
                <div style={{ fontSize:10,color:"#7d8590",marginTop:3,fontFamily:"JetBrains Mono,monospace" }}>Risk: {Math.round(c.risk_score)}/100</div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
