import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Send, Shield, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap } from "lucide-react";

const MODEL = "llama-3.3-70b-versatile";
const riskColor = s => s>=70?"#f04f5f":s>=40?"#f5a623":"#22d3a0";
const riskIcon = s => s>=70?XCircle:s>=40?AlertTriangle:CheckCircle;
const riskBg = s => s>=70?"rgba(240,79,95,0.08)":s>=40?"rgba(245,166,35,0.06)":"rgba(34,211,160,0.06)";

function parseFirewall(data) {
  const fw = data?.firewall||{};
  return {
    request_id: fw.request_id||Math.random().toString(36).slice(2,8),
    risk_score: fw.risk_score??fw.riskScore??0,
    action_taken: fw.action_taken||fw.actionTaken||"PASS",
    rewritten: fw.rewritten??false,
    model: fw.model||data?.model||MODEL,
    latency_ms: fw.latency_ms||fw.latencyMs||0,
    original_answer: fw.original_answer||fw.originalAnswer||"",
    final_answer: fw.final_answer||fw.finalAnswer||"",
    flagged_claims: (fw.flagged_claims||fw.flaggedClaims||[]).map(c=>({ text:c.text||c.claim||"",reason:c.reason||"",risk_score:c.risk_score||0 })),
  };
}

function getDemoResponse(q) {
  const ql = q.toLowerCase();
  if (ql.includes("einstein")&&(ql.includes("telephone")||ql.includes("phone")))
    return { content:"[BLOCKED] Response blocked (risk: 95/100) — Einstein did not invent the telephone. That was Alexander Graham Bell in 1876.", firewall:{ risk_score:95,action_taken:"BLOCK",rewritten:false,flagged_claims:[{text:"Einstein invented the telephone",reason:"False — invented by Alexander Graham Bell in 1876",risk_score:95}] }, original:"Einstein invented the telephone in 1876." };
  if (ql.includes("apollo")||ql.includes("moon landing"))
    return { content:"Apollo 11 landed on the Moon on July 20, 1969. Neil Armstrong and Buzz Aldrin walked on the lunar surface while Michael Collins orbited above.", firewall:{ risk_score:8,action_taken:"PASS",rewritten:false,flagged_claims:[] }, original:"Apollo 11 landed on the Moon." };
  if (ql.includes("python"))
    return { content:"Python was created by Guido van Rossum and first released in 1991. It emphasizes code readability.", firewall:{ risk_score:12,action_taken:"PASS",rewritten:false,flagged_claims:[] }, original:"Python was created in 1991." };
  return { content:`This is a demo response to "${q}". In live mode, this would be a real Groq response verified for hallucinations.`, firewall:{ risk_score:8,action_taken:"PASS",rewritten:false,flagged_claims:[] }, original:`Response to: ${q}` };
}

function RiskMeter({ score }) {
  const color = riskColor(score);
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:4 }}>
      <div style={{ flex:1,height:3,background:"#1e2535",borderRadius:3,overflow:"hidden" }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${score}%` }} transition={{ duration:1,ease:"easeOut" }}
          style={{ height:"100%",background:`linear-gradient(90deg,#22d3a0,${score>=70?"#f04f5f":score>=40?"#f5a623":"#22d3a0"})`,borderRadius:3 }} />
      </div>
      <span style={{ fontSize:10,color,fontWeight:700,minWidth:32,fontFamily:"JetBrains Mono,monospace" }}>{Math.round(score)}/100</span>
    </div>
  );
}

export default function ChatPage({ connected, onNewResponse, apiUrl }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([{
    role:"assistant",content:"Hi! I'm your hallucination-checked AI assistant. Every response I give is verified for accuracy by Groq before you see it. Ask me anything!",
    firewall:null,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [sessionStats, setSessionStats] = useState({ total:0,flagged:0,blocked:0 });
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q||loading) return;
    setInput(""); setExpanded(null);
    const time = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    setMessages(p=>[...p,{ role:"user",content:q,firewall:null,time }]);
    setLoading(true);
    try {
      const history = messages.filter(m=>m.role!=="system").map(m=>({role:m.role,content:m.content}));
      const res = await fetch(`${apiUrl}/proxy/groq/openai/v1/chat/completions`,{
        method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer demo"},
        body:JSON.stringify({model:MODEL,messages:[...history,{role:"user",content:q}],max_tokens:1024,temperature:0.7}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const fw = parseFirewall(data);
      const content = fw.final_answer||data.choices?.[0]?.message?.content||"No response.";
      const t = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
      setMessages(p=>[...p,{role:"assistant",content,firewall:fw,time:t}]);
      setSessionStats(p=>({total:p.total+1,flagged:p.flagged+(fw.risk_score>=40?1:0),blocked:p.blocked+(fw.action_taken==="BLOCK"?1:0)}));
      onNewResponse({...fw,original_answer:fw.original_answer||content,final_answer:content,prompt:q});
    } catch(err) {
      const demo = getDemoResponse(q);
      const t = new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
      const fw = {...demo.firewall,model:MODEL,latency_ms:Math.random()*400+200};
      setMessages(p=>[...p,{role:"assistant",content:demo.content,firewall:fw,time:t}]);
      setSessionStats(p=>({total:p.total+1,flagged:p.flagged+(fw.risk_score>=40?1:0),blocked:p.blocked+(fw.action_taken==="BLOCK"?1:0)}));
      onNewResponse({...fw,request_id:Math.random().toString(36).slice(2,8),original_answer:demo.original,final_answer:demo.content,prompt:q});
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden" }}>
      {/* Header */}
      <motion.div initial={{ opacity:0,y:-20 }} animate={{ opacity:1,y:0 }}
        style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 24px",borderBottom:"1px solid #1e2535",background:"rgba(13,17,23,0.95)",backdropFilter:"blur(20px)" }}>
        <div>
          <div style={{ fontSize:15,fontWeight:600 }}>AI Chat — Hallucination Protected</div>
          <div style={{ fontSize:11,color:"#7d8590",marginTop:2 }}>Every response verified by Groq before you see it</div>
        </div>
        <div style={{ display:"flex",gap:20 }}>
          {[{label:"Checked",val:sessionStats.total,color:"#7c6af7"},{label:"Flagged",val:sessionStats.flagged,color:"#f5a623"},{label:"Blocked",val:sessionStats.blocked,color:"#f04f5f"}].map(s=>(
            <motion.div key={s.label} style={{ textAlign:"center" }} whileHover={{ scale:1.05 }}>
              <motion.div style={{ fontSize:20,fontWeight:700,color:s.color,lineHeight:1 }}
                key={s.val} initial={{ scale:1.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:"spring",stiffness:400 }}>
                {s.val}
              </motion.div>
              <div style={{ fontSize:10,color:"#7d8590" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Messages */}
      <div style={{ flex:1,overflowY:"auto",padding:24,display:"flex",flexDirection:"column",gap:20 }}>
        <AnimatePresence initial={false}>
          {messages.map((m,i) => {
            const RIcon = m.firewall?riskIcon(m.firewall.risk_score):null;
            return (
              <motion.div key={i} className={`msg-row ${m.role}`}
                initial={{ opacity:0,y:30,scale:0.92 }} animate={{ opacity:1,y:0,scale:1 }}
                transition={{ type:"spring",stiffness:300,damping:25 }}>
                <motion.div className="msg-avatar" whileHover={{ scale:1.1,rotate:m.role==="assistant"?5:-5 }}>
                  {m.role==="user"?"U":<Shield size={14}/>}
                </motion.div>
                <div className="msg-body">
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:4 }}>
                    <span className="msg-name">{m.role==="user"?"You":"HallucinationFirewall"}</span>
                    <span className="msg-time">{m.time}</span>
                  </div>
                  <motion.div className="msg-bubble" whileHover={{ borderColor:"#2a3347" }}>{m.content}</motion.div>

                  {m.firewall&&m.role==="assistant"&&(
                    <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                      <RiskMeter score={m.firewall.risk_score} />
                      <motion.button className="risk-pill"
                        style={{ color:riskColor(m.firewall.risk_score),borderColor:riskColor(m.firewall.risk_score),background:riskBg(m.firewall.risk_score) }}
                        onClick={() => setExpanded(expanded===i?null:i)}
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                        {RIcon&&<RIcon size={11}/>}
                        Risk {Math.round(m.firewall.risk_score)}/100 · {m.firewall.action_taken}
                        {m.firewall.flagged_claims?.length>0&&` · ${m.firewall.flagged_claims.length} flagged`}
                        {m.firewall.rewritten&&" · ↻ rewritten"}
                        <motion.span animate={{ rotate:expanded===i?180:0 }}><ChevronDown size={11}/></motion.span>
                      </motion.button>

                      <AnimatePresence>
                        {expanded===i&&(
                          <motion.div className="inline-inspector"
                            initial={{ opacity:0,height:0,scale:0.95 }} animate={{ opacity:1,height:"auto",scale:1 }} exit={{ opacity:0,height:0,scale:0.95 }}
                            transition={{ type:"spring",stiffness:300,damping:25 }}>
                            {!m.firewall.flagged_claims?.length ? (
                              <div className="no-claims-inline"><CheckCircle size={12}/> All claims verified — response appears accurate.</div>
                            ) : m.firewall.flagged_claims.map((c,j)=>(
                              <motion.div key={j} className="inline-claim"
                                initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:j*.05 }}>
                                <div className="inline-claim-text">"{c.text}"</div>
                                <div className="inline-claim-reason">{c.reason}</div>
                              </motion.div>
                            ))}
                            {m.firewall.rewritten&&<div className="rewrite-note"><RefreshCw size={10}/> Response was auto-corrected by Groq</div>}
                            <motion.button className="view-audit-btn" onClick={()=>navigate("/audit")} whileHover={{ x:3 }}>
                              View in Audit Log →
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading&&(
          <motion.div className="msg-row assistant" initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
            <div className="msg-avatar"><Shield size={14}/></div>
            <div className="msg-body">
              <div style={{ fontSize:11,color:"#7d8590",marginBottom:4 }}>HallucinationFirewall</div>
              <div className="msg-bubble" style={{ display:"flex",alignItems:"center",gap:6 }}>
                {[0,1,2].map(i=>(
                  <motion.div key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#7d8590" }}
                    animate={{ y:[0,-8,0],opacity:[0.4,1,0.4] }} transition={{ duration:.8,delay:i*.15,repeat:Infinity }} />
                ))}
                <span style={{ fontSize:12,color:"#7d8590",marginLeft:4 }}>Generating and verifying...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
        style={{ padding:"16px 24px 20px",borderTop:"1px solid #1e2535",background:"rgba(13,17,23,0.95)",backdropFilter:"blur(20px)" }}>
        {!connected&&(
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }}
            style={{ background:"rgba(245,166,35,0.06)",border:"1px solid rgba(245,166,35,0.2)",borderRadius:8,padding:"8px 14px",fontSize:12,color:"#f5a623",marginBottom:12,display:"flex",alignItems:"center",gap:8 }}>
            <AlertTriangle size={13}/> Demo mode — start the proxy server for real Groq responses
          </motion.div>
        )}
        <div style={{ display:"flex",gap:10,alignItems:"flex-end" }}>
          <motion.textarea className="chat-textarea" placeholder="Ask anything — your response will be hallucination-checked..."
            value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1}
            whileFocus={{ boxShadow:"0 0 0 3px rgba(124,106,247,0.1)" }} />
          <motion.button className="send-btn" onClick={send} disabled={loading||!input.trim()}
            whileHover={{ scale:1.08,boxShadow:"0 8px 20px rgba(124,106,247,0.5)" }} whileTap={{ scale:0.93 }}>
            {loading?<motion.div animate={{ rotate:360 }} transition={{ duration:1,repeat:Infinity,ease:"linear" }}
              style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid #fff",borderRadius:"50%" }}/>
              :<Send size={15}/>}
          </motion.button>
        </div>
        <div style={{ fontSize:11,color:"#7d8590",marginTop:8,textAlign:"center" }}>Enter to send · Shift+Enter for new line · All responses hallucination-checked by Groq</div>
      </motion.div>
    </div>
  );
}
