import { motion, AnimatePresence } from "framer-motion";
const riskColor = s => s>=70?"#f04f5f":s>=40?"#f5a623":"#22d3a0";
const riskBg = s => s>=70?"rgba(240,79,95,.1)":s>=40?"rgba(245,166,35,.08)":"rgba(34,211,160,.08)";
const riskRing = s => s>=70?"rgba(240,79,95,.25)":s>=40?"rgba(245,166,35,.25)":"rgba(34,211,160,.2)";

export default function ResponseLog({ responses, selected, onSelect }) {
  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
        <span style={{ fontSize:11,fontWeight:700,color:"#7d8590",textTransform:"uppercase",letterSpacing:".07em" }}>
          Response log ({responses.length})
        </span>
      </div>
      <div style={{ border:"1px solid #1e2535",borderRadius:12,overflow:"hidden",background:"#0d1117" }}>
        {responses.length===0&&<div style={{ padding:32,color:"#7d8590",fontSize:13,textAlign:"center" }}>No responses match this filter.</div>}
        <AnimatePresence>
          {responses.map((r,i) => {
            const isActive = selected?.request_id===r.request_id;
            return (
              <motion.div key={r.request_id}
                initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:20 }}
                transition={{ delay:i*0.04,type:"spring",stiffness:300 }}
                whileHover={{ backgroundColor:"#161b27" }}
                onClick={() => onSelect(isActive?null:r)}
                style={{ display:"flex",alignItems:"center",gap:10,padding:isActive?"11px 12px 11px 10px":"12px 14px",borderBottom:i<responses.length-1?"1px solid #1e2535":"none",cursor:"pointer",borderLeft:isActive?"2px solid #7c6af7":"2px solid transparent",background:isActive?"rgba(124,106,247,0.05)":"transparent",transition:"background .12s" }}>
                <motion.div whileHover={{ scale:1.1 }}
                  style={{ width:38,height:38,borderRadius:"50%",background:riskBg(r.risk_score),color:riskColor(r.risk_score),boxShadow:`0 0 0 1.5px ${riskRing(r.risk_score)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>
                  {Math.round(r.risk_score)}
                </motion.div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{r.original_answer}</div>
                  <div style={{ fontSize:10,color:"#7d8590",marginTop:2,fontFamily:"JetBrains Mono,monospace" }}>
                    {r.request_id} · {r.model} · {Math.round(r.latency_ms)}ms · {r.flagged_claims?.length} flagged
                  </div>
                </div>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0 }}>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,
                    background:r.action_taken==="BLOCK"?"rgba(240,79,95,.12)":r.action_taken==="WARN"?"rgba(245,166,35,.1)":r.action_taken==="REWRITE"?"rgba(79,142,240,.1)":"rgba(34,211,160,.08)",
                    color:r.action_taken==="BLOCK"?"#f04f5f":r.action_taken==="WARN"?"#f5a623":r.action_taken==="REWRITE"?"#4f8ef0":"#22d3a0",
                    border:`1px solid ${r.action_taken==="BLOCK"?"rgba(240,79,95,.2)":r.action_taken==="WARN"?"rgba(245,166,35,.2)":r.action_taken==="REWRITE"?"rgba(79,142,240,.2)":"rgba(34,211,160,.15)"}` }}>
                    {r.action_taken}
                  </span>
                  {r.rewritten&&<span style={{ fontSize:10,color:"#4f8ef0" }}>↻ rewritten</span>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
