import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Shield, Eye, EyeOff, Lock, Mail, User, ArrowRight, Sparkles } from "lucide-react";

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 4 + 2, duration: Math.random() * 8 + 6, delay: Math.random() * 4,
}));

function FieldInput({ icon: Icon, label, type = "text", value, onChange, placeholder, onFocus, onBlur, focused, onEnter, suffix }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: "#7d8590", fontWeight: 500, display: "block", marginBottom: 6 }}>{label}</label>
      <motion.div
        animate={{ borderColor: focused ? "rgba(124,106,247,0.8)" : "#1e2535", boxShadow: focused ? "0 0 0 3px rgba(124,106,247,0.1)" : "none" }}
        style={{ display: "flex", alignItems: "center", gap: 10, background: "#161b27", border: "1px solid #1e2535", borderRadius: 8, padding: "10px 14px" }}>
        <Icon size={14} color={focused ? "#7c6af7" : "#7d8590"} style={{ flexShrink: 0 }} />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          onFocus={onFocus} onBlur={onBlur} onKeyDown={e => e.key === "Enter" && onEnter()}
          style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e6edf3", fontSize: 13, fontFamily: "inherit" }} />
        {suffix}
      </motion.div>
    </div>
  );
}

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Email and password are required."); return; }
    if (tab === "signup" && !name.trim()) { setError("Full name is required."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const userData = { name: name.trim() || email.split("@")[0], email: email.trim() };
    try { localStorage.setItem("hf_user", JSON.stringify(userData)); } catch {}
    onLogin(userData);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080b12", position: "relative", overflow: "hidden" }}>
      {/* Animated background orbs */}
      {[{ x:"10%",y:"20%",s:400,c:"rgba(124,106,247,0.07)" },{ x:"75%",y:"60%",s:500,c:"rgba(34,211,160,0.04)" },{ x:"40%",y:"85%",s:300,c:"rgba(79,142,240,0.05)" }].map((o,i) => (
        <motion.div key={i} style={{ position:"absolute",left:o.x,top:o.y,width:o.s,height:o.s,borderRadius:"50%",background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`,transform:"translate(-50%,-50%)",pointerEvents:"none" }}
          animate={{ scale:[1,1.3,1],x:[0,40,0],y:[0,-40,0] }}
          transition={{ duration:8+i*3,repeat:Infinity,ease:"easeInOut",delay:i*2 }} />
      ))}

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <motion.div key={p.id} style={{ position:"absolute",left:`${p.x}%`,top:`${p.y}%`,width:p.size,height:p.size,borderRadius:"50%",background:"rgba(124,106,247,0.5)",pointerEvents:"none" }}
          animate={{ y:[0,-30,0],opacity:[0.2,0.7,0.2],scale:[1,1.5,1] }}
          transition={{ duration:p.duration,delay:p.delay,repeat:Infinity,ease:"easeInOut" }} />
      ))}

      {/* Grid */}
      <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(124,106,247,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,106,247,0.03) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none" }} />

      <motion.div
        initial={{ opacity:0,y:60,scale:0.9 }} animate={{ opacity:1,y:0,scale:1 }}
        transition={{ type:"spring",stiffness:150,damping:20 }}
        style={{ background:"rgba(13,17,23,0.92)",backdropFilter:"blur(40px)",border:"1px solid rgba(124,106,247,0.2)",borderRadius:24,padding:"44px 40px",width:"100%",maxWidth:420,position:"relative",zIndex:1,boxShadow:"0 30px 80px rgba(0,0,0,0.6)" }}>

        {/* Glow line */}
        <motion.div style={{ position:"absolute",top:0,left:"10%",right:"10%",height:1,background:"linear-gradient(90deg,transparent,rgba(124,106,247,0.8),transparent)" }}
          animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:2,repeat:Infinity }} />

        {/* Logo */}
        <motion.div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12,marginBottom:32 }}
          initial={{ opacity:0,y:-30 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}>
          <motion.div style={{ width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#7c6af7,#5b4fe0)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 40px rgba(124,106,247,0.5)" }}
            animate={{ rotate:[0,5,-5,0],boxShadow:["0 0 40px rgba(124,106,247,0.5)","0 0 60px rgba(124,106,247,0.8)","0 0 40px rgba(124,106,247,0.5)"] }}
            transition={{ duration:4,repeat:Infinity }} whileHover={{ scale:1.1 }}>
            <Shield size={30} color="#fff" />
          </motion.div>
          <h1 style={{ fontSize:22,fontWeight:800,background:"linear-gradient(135deg,#e6edf3,#7c6af7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
            Veridion
          </h1>
          <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#7d8590" }}>
            <Sparkles size={11} /> AI response security powered by Groq
          </div>
        </motion.div>

        {/* Tab switcher */}
        <motion.div style={{ display:"flex",background:"#161b27",borderRadius:10,padding:3,marginBottom:24,position:"relative" }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
          {["login","signup"].map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); setError(""); }}
              style={{ flex:1,padding:8,border:"none",background:"none",color:tab===t?"#e6edf3":"#7d8590",fontSize:13,fontWeight:500,borderRadius:8,cursor:"pointer",position:"relative",zIndex:1,fontFamily:"inherit",transition:"color .2s" }}>
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
          <motion.div animate={{ x:tab==="login"?0:"calc(100% + 3px)" }} transition={{ type:"spring",stiffness:400,damping:30 }}
            style={{ position:"absolute",top:3,bottom:3,width:"calc(50% - 3px)",background:"#1e2535",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,0.3)" }} />
        </motion.div>

        {/* Fields */}
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <AnimatePresence>
            {tab === "signup" && (
              <motion.div key="name" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }}>
                <FieldInput icon={User} label="Full name" value={name} onChange={setName} placeholder="Abhinav Sarda"
                  onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} focused={focused==="name"} onEnter={submit} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.35 }}>
            <FieldInput icon={Mail} label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com"
              onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} focused={focused==="email"} onEnter={submit} />
          </motion.div>

          <motion.div initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.4 }}>
            <FieldInput icon={Lock} label="Password" type={showPass?"text":"password"} value={password} onChange={setPassword} placeholder="••••••••"
              onFocus={() => setFocused("pass")} onBlur={() => setFocused(null)} focused={focused==="pass"} onEnter={submit}
              suffix={<button type="button" onClick={() => setShowPass(!showPass)} style={{ background:"none",border:"none",color:"#7d8590",cursor:"pointer",display:"flex",padding:0 }}>{showPass?<EyeOff size={14}/>:<Eye size={14}/>}</button>} />
          </motion.div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0,y:-10,height:0 }} animate={{ opacity:1,y:0,height:"auto" }} exit={{ opacity:0,height:0 }}
              style={{ background:"rgba(240,79,95,0.08)",border:"1px solid rgba(240,79,95,0.2)",borderRadius:8,padding:"9px 13px",fontSize:12,color:"#f04f5f",marginTop:14 }}>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button type="button" onClick={submit} disabled={loading}
          whileHover={{ scale:1.02,boxShadow:"0 8px 30px rgba(124,106,247,0.5)" }} whileTap={{ scale:0.97 }}
          style={{ width:"100%",marginTop:20,background:"linear-gradient(135deg,#7c6af7,#5b4fe0)",color:"#fff",border:"none",borderRadius:10,padding:12,fontSize:14,fontWeight:600,cursor:"pointer",boxShadow:"0 4px 20px rgba(124,106,247,0.4)",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
          {loading ? (
            <>
              <motion.div animate={{ rotate:360 }} transition={{ duration:1,repeat:Infinity,ease:"linear" }}
                style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTop:"2px solid #fff",borderRadius:"50%" }} />
              Verifying...
            </>
          ) : (
            <>
              {tab==="login"?"Sign in":"Create account"}
              <motion.div animate={{ x:[0,4,0] }} transition={{ duration:1.5,repeat:Infinity }}><ArrowRight size={14}/></motion.div>
            </>
          )}
        </motion.button>

        <motion.p style={{ fontSize:11,color:"#7d8590",textAlign:"center",marginTop:18 }}
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}>
          Demo: enter any email + password to continue
        </motion.p>
      </motion.div>
    </div>
  );
}
