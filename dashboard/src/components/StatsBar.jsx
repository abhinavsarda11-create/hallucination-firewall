import { motion } from "framer-motion";
const riskColor = s => s>=70?"#f04f5f":s>=40?"#f5a623":"#22d3a0";
export default function StatsBar({ stats }) {
  const cards = [
    { label:"Total intercepted", value:stats.total,    color:"#7c6af7" },
    { label:"Flagged (≥40)",     value:stats.flagged,  color:"#f5a623" },
    { label:"Blocked",           value:stats.blocked,  color:"#f04f5f" },
    { label:"Auto-rewritten",    value:stats.rewritten,color:"#4f8ef0" },
    { label:"Avg risk score",    value:`${stats.avgRisk}/100`, color:riskColor(stats.avgRisk) },
  ];
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:16 }}>
      {cards.map((c,i) => (
        <motion.div key={c.label}
          initial={{ opacity:0,y:20,scale:0.9 }} animate={{ opacity:1,y:0,scale:1 }}
          transition={{ delay:i*0.07,type:"spring",stiffness:300 }}
          whileHover={{ y:-4,boxShadow:"0 12px 30px rgba(0,0,0,0.3)" }}
          style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden" }}>
          <motion.div style={{ position:"absolute",bottom:0,left:0,right:0,height:2,background:c.color,opacity:0.4 }}
            animate={{ opacity:[0.2,0.6,0.2] }} transition={{ duration:2,repeat:Infinity,delay:i*0.3 }} />
          <motion.div style={{ fontSize:24,fontWeight:700,color:c.color,lineHeight:1 }}
            key={c.value} initial={{ scale:1.3,opacity:0 }} animate={{ scale:1,opacity:1 }}
            transition={{ type:"spring",stiffness:400 }}>
            {c.value}
          </motion.div>
          <div style={{ fontSize:11,color:"#7d8590",marginTop:4 }}>{c.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
