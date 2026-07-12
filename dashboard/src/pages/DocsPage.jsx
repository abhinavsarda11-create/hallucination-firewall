import { motion } from "framer-motion";
const ACTIONS=[
  { name:"PASS",color:"#22d3a0",bg:"rgba(34,211,160,.06)",border:"rgba(34,211,160,.15)",desc:"Risk <40. Response verified and returned unchanged." },
  { name:"WARN",color:"#f5a623",bg:"rgba(245,166,35,.06)",border:"rgba(245,166,35,.15)",desc:"Risk 40–74. Returned with risk metadata attached for your app to handle." },
  { name:"BLOCK",color:"#f04f5f",bg:"rgba(240,79,95,.06)",border:"rgba(240,79,95,.15)",desc:"Risk 75+. Response completely replaced with a block message." },
  { name:"REWRITE",color:"#4f8ef0",bg:"rgba(79,142,240,.06)",border:"rgba(79,142,240,.15)",desc:"Groq automatically rewrites the response to correct or remove flagged claims." },
];
const STEPS=[
  { step:"01",icon:"📥",title:"Request intercepted",desc:"Your app sends prompts to the firewall proxy instead of Groq directly." },
  { step:"02",icon:"🤖",title:"Groq responds",desc:"Proxy forwards to Groq and catches the response." },
  { step:"03",icon:"🔍",title:"Claims extracted",desc:"A second Groq call extracts every verifiable factual statement." },
  { step:"04",icon:"🧠",title:"AI verification",desc:"Groq verifies each claim using world knowledge — any topic, no database needed." },
  { step:"05",icon:"📊",title:"Risk scored",desc:"Inaccurate claims push score toward 100. Verified claims keep it low." },
  { step:"06",icon:"⚡",title:"Action taken",desc:"PASS, WARN, BLOCK, or REWRITE based on your configured thresholds." },
];
const FAQS=[
  { q:"Does it need a knowledge database?",a:"No — the AI verifier uses Groq's own world knowledge. Works for any topic out of the box." },
  { q:"How do I integrate it?",a:'Change your Groq base URL from "https://api.groq.com" to "http://localhost:8080/proxy/groq" — everything else stays the same.' },
  { q:"Will this slow down responses?",a:"It adds 300–800ms for the extraction and verification calls. Groq's speed (800 tokens/s) keeps this minimal." },
  { q:"Can I use it with OpenAI?",a:"Yes. Point your OpenAI calls at /proxy/openai and add OPENAI_API_KEY to .env." },
  { q:"Is the audit log persistent?",a:"Yes — saved to browser localStorage per user email. Survives page refreshes and browser restarts." },
];
export default function DocsPage() {
  return (
    <div style={{ padding:"28px 32px",maxWidth:860 }}>
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
        <h1 style={{ fontSize:24,fontWeight:700,letterSpacing:"-.4px" }}>Documentation</h1>
        <p style={{ fontSize:14,color:"#7d8590",marginTop:6,lineHeight:1.7,maxWidth:600 }}>Everything you need to understand, configure, and integrate the Hallucination Firewall.</p>
      </motion.div>

      {/* Pipeline */}
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7c6af7",margin:"28px 0 10px" }}>How it works</div>
      <div style={{ border:"1px solid #1e2535",borderRadius:12,overflow:"hidden",marginBottom:32 }}>
        {STEPS.map((s,i)=>(
          <motion.div key={s.step} initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*.06 }}
            whileHover={{ backgroundColor:"#161b27",x:4 }}
            style={{ display:"flex",gap:14,padding:"16px 20px",borderBottom:i<STEPS.length-1?"1px solid #1e2535":"none",alignItems:"flex-start",transition:"all .15s" }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#7c6af7",fontFamily:"JetBrains Mono,monospace",paddingTop:2,flexShrink:0 }}>{s.step}</div>
            <div style={{ fontSize:19 }}>{s.icon}</div>
            <div><div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{s.title}</div><div style={{ fontSize:12,color:"#7d8590",lineHeight:1.6 }}>{s.desc}</div></div>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7c6af7",marginBottom:10 }}>Firewall actions</div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:32 }}>
        {ACTIONS.map((a,i)=>(
          <motion.div key={a.name} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*.08 }}
            whileHover={{ y:-3,boxShadow:"0 8px 20px rgba(0,0,0,0.2)" }}
            style={{ border:`1px solid ${a.border}`,background:a.bg,borderRadius:12,padding:"16px 18px" }}>
            <div style={{ fontSize:13,fontWeight:700,letterSpacing:".05em",color:a.color,marginBottom:6 }}>{a.name}</div>
            <div style={{ fontSize:13,color:"#7d8590",lineHeight:1.65 }}>{a.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Integration */}
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7c6af7",marginBottom:10 }}>Integration</div>
      <motion.div whileHover={{ borderColor:"rgba(124,106,247,.3)" }}
        style={{ background:"rgba(124,106,247,.05)",border:"1px solid rgba(124,106,247,.15)",borderRadius:12,padding:"16px 18px",fontSize:13,color:"#7d8590",lineHeight:1.65,display:"flex",gap:10,marginBottom:32,transition:"border-color .2s" }}>
        <span style={{ fontSize:16,flexShrink:0 }}>💡</span>
        <span>Change your base URL from <strong style={{ color:"#e6edf3" }}>https://api.groq.com</strong> to <strong style={{ color:"#7c6af7" }}>http://localhost:8080/proxy/groq</strong> — everything else in your app stays exactly the same.</span>
      </motion.div>

      {/* Endpoints */}
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7c6af7",marginBottom:10 }}>API endpoints</div>
      <div style={{ border:"1px solid #1e2535",borderRadius:12,overflow:"hidden",marginBottom:32 }}>
        {[["GET","/health","Proxy health check"],["POST","/proxy/groq/openai/v1/chat/completions","Main Groq intercept"],["POST","/proxy/openai/v1/chat/completions","OpenAI intercept"]].map(([m,p,d],i)=>(
          <motion.div key={p} whileHover={{ backgroundColor:"#161b27" }}
            style={{ display:"flex",gap:12,alignItems:"flex-start",padding:"13px 18px",borderBottom:i<2?"1px solid #1e2535":"none",transition:"background .12s" }}>
            <span style={{ fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,flexShrink:0,marginTop:2,
              background:m==="GET"?"rgba(34,211,160,.08)":"rgba(124,106,247,.08)",
              color:m==="GET"?"#22d3a0":"#7c6af7",
              border:`1px solid ${m==="GET"?"rgba(34,211,160,.15)":"rgba(124,106,247,.15)"}` }}>{m}</span>
            <div>
              <div style={{ fontSize:13,fontWeight:600,fontFamily:"JetBrains Mono,monospace",marginBottom:3 }}>{p}</div>
              <div style={{ fontSize:12,color:"#7d8590" }}>{d}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ fontSize:11,fontWeight:700,letterSpacing:".09em",textTransform:"uppercase",color:"#7c6af7",marginBottom:10 }}>FAQ</div>
      <div style={{ border:"1px solid #1e2535",borderRadius:12,overflow:"hidden" }}>
        {FAQS.map((f,i)=>(
          <motion.div key={f.q} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.06 }}
            whileHover={{ backgroundColor:"#161b27" }}
            style={{ padding:"16px 20px",borderBottom:i<FAQS.length-1?"1px solid #1e2535":"none",transition:"background .12s" }}>
            <div style={{ fontSize:14,fontWeight:600,marginBottom:6 }}>{f.q}</div>
            <div style={{ fontSize:13,color:"#7d8590",lineHeight:1.7 }}>{f.a}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
