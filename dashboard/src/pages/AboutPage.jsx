import { motion } from "framer-motion";
const container = { hidden:{}, show:{ transition:{ staggerChildren:0.07 } } };
const item = { hidden:{ opacity:0,x:-20 }, show:{ opacity:1,x:0,transition:{ type:"spring",stiffness:300 } } };
const PIPELINE = [
  { step:"01",icon:"📥",title:"Request intercepted",desc:"Your app sends prompts to the firewall proxy instead of Groq directly. The proxy forwards them to Groq on your behalf." },
  { step:"02",icon:"🤖",title:"Groq responds",desc:"Groq processes the request using llama-3.3-70b-versatile and sends back a raw response before it reaches your app." },
  { step:"03",icon:"🔍",title:"Claims extracted",desc:"A second Groq call reads the response and pulls out every verifiable factual statement — dates, names, scientific facts." },
  { step:"04",icon:"🧠",title:"Claims verified by AI",desc:"Each claim is sent to Groq with a verification prompt. Groq judges accuracy using its world knowledge — no database needed." },
  { step:"05",icon:"📊",title:"Risk scored",desc:"Claims judged inaccurate push the risk score toward 100. Verified claims keep it low. Final score is 0–100 per response." },
  { step:"06",icon:"⚡",title:"Action taken",desc:"Response is PASSED, WARNED, BLOCKED, or REWRITTEN based on your configured thresholds." },
];
const COMPONENTS = [
  { name:"Claim Extractor",role:"Groq · llama-3.3-70b-versatile",desc:"Reads every LLM response and extracts all verifiable factual claims as structured JSON.",color:"#7c6af7" },
  { name:"AI Verifier",role:"Groq · world knowledge",desc:"Uses Groq to verify each claim — no static knowledge base needed. Works for any topic automatically.",color:"#22d3a0" },
  { name:"Risk Scorer",role:"0–100 confidence engine",desc:"Aggregates per-claim AI verdicts into a single hallucination risk score per response.",color:"#4f8ef0" },
  { name:"Action Engine",role:"PASS · WARN · BLOCK · REWRITE",desc:"Applies configurable thresholds and takes automatic action — including Groq-powered rewriting.",color:"#f5a623" },
];
export default function AboutPage() {
  return (
    <div style={{ padding:"28px 32px",maxWidth:900 }}>
      <motion.div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"40px 0 36px",borderBottom:"1px solid #1e2535",marginBottom:32,textAlign:"center" }}
        initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }}>
        <motion.div style={{ fontSize:60 }} animate={{ y:[0,-8,0],rotate:[0,5,-5,0] }} transition={{ duration:4,repeat:Infinity }}>🛡</motion.div>
        <motion.h1 style={{ fontSize:30,fontWeight:800,background:"linear-gradient(135deg,#e6edf3,#7c6af7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
          Veridion
        </motion.h1>
        <p style={{ fontSize:14,color:"#7d8590",maxWidth:560,lineHeight:1.7 }}>
          A drop-in middleware proxy that intercepts every LLM response, verifies factual claims using Groq's world knowledge, and acts in real time — before hallucinations reach your users.
        </p>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:6 }}>
          {["Powered by Groq","llama-3.3-70b-versatile","FastAPI proxy","React SPA","Framer Motion","No static DB"].map((b,i)=>(
            <motion.span key={b} initial={{ opacity:0,scale:0 }} animate={{ opacity:1,scale:1 }} transition={{ delay:i*.05,type:"spring" }}
              whileHover={{ scale:1.08,background:"rgba(124,106,247,.12)",borderColor:"rgba(124,106,247,.3)" }}
              style={{ background:"#161b27",border:"1px solid #1e2535",borderRadius:20,padding:"4px 14px",fontSize:11,color:"#7d8590",cursor:"default",transition:"all .15s" }}>
              {b}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7d8590",marginBottom:14 }}>The pipeline</div>
      <motion.div style={{ border:"1px solid #1e2535",borderRadius:12,overflow:"hidden",marginBottom:40 }} variants={container} initial="hidden" animate="show">
        {PIPELINE.map((p,i)=>(
          <motion.div key={p.step} variants={item} whileHover={{ backgroundColor:"#161b27",x:4 }}
            style={{ display:"flex",gap:16,padding:"16px 20px",borderBottom:i<PIPELINE.length-1?"1px solid #1e2535":"none",alignItems:"flex-start",transition:"background .15s" }}>
            <motion.div style={{ fontSize:11,fontWeight:700,color:"#7c6af7",fontFamily:"JetBrains Mono,monospace",paddingTop:2,flexShrink:0,width:24 }}>{p.step}</motion.div>
            <div style={{ fontSize:20,flexShrink:0 }}>{p.icon}</div>
            <div>
              <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{p.title}</div>
              <div style={{ fontSize:12,color:"#7d8590",lineHeight:1.6 }}>{p.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7d8590",marginBottom:14 }}>Core components</div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12 }}>
        {COMPONENTS.map((c,i)=>(
          <motion.div key={c.name}
            initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*.08,type:"spring" }}
            whileHover={{ y:-4,boxShadow:"0 12px 30px rgba(0,0,0,0.3)",borderColor:"#2a3347" }}
            style={{ background:"#0d1117",border:"1px solid #1e2535",borderRadius:12,padding:18,transition:"all .2s",position:"relative",overflow:"hidden" }}>
            <motion.div style={{ position:"absolute",top:0,left:0,width:3,height:"100%",background:c.color,opacity:0.6 }}
              animate={{ opacity:[0.4,0.8,0.4] }} transition={{ duration:2,repeat:Infinity,delay:i*.5 }} />
            <div style={{ paddingLeft:10 }}>
              <div style={{ fontSize:14,fontWeight:600,marginBottom:3 }}>{c.name}</div>
              <div style={{ fontSize:11,color:c.color,marginBottom:8,fontFamily:"JetBrains Mono,monospace" }}>{c.role}</div>
              <div style={{ fontSize:12,color:"#7d8590",lineHeight:1.6 }}>{c.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop:40,paddingTop:20,borderTop:"1px solid #1e2535",textAlign:"center",fontSize:12,color:"#7d8590" }}>
        Built with FastAPI · Groq · React · Framer Motion · Recharts · Railway · Netlify
      </div>
    </div>
  );
}
