<img width="4320" height="1440" alt="hh26 main poster 2 with sponsors 3x1 (4320 x 1440 px) (2)" src="https://github.com/user-attachments/assets/c698b2cd-da84-4cb0-9276-125c6a7244aa" />


# 🛡️ Veridion

> Middleware that intercepts LLM responses, verifies every factual claim in real time, and blocks or rewrites hallucinations before they reach your users.

---

## 📌 Problem & Domain

LLMs answer confidently even when they're wrong — inventing statistics, dates, and facts with no visible warning sign. There's currently no standard safety layer that checks an AI response for hallucinated claims before it reaches an end user. Veridion sits between your app and Groq, verifies every claim in the response, and takes action before anything unsafe is shown.

**Themes Selected:**
- [ ] Human Experience & Productivity
- [ ] Climate & Sustainability Systems
- [ ] HealthTech & Bio Platforms
- [ ] Learning & Knowledge Systems
- [ ] Work, Finance & Digital Economy
- [ ] Infrastructure, Mobility & Smart Systems
- [x] Trust, Identity & Security
- [ ] Media, Social & Interactive Platforms
- [ ] Public Systems, Governance and Civic Tech
- [x] Developer Tools & Software Infrastructure

---

## 🎯 Objective

Veridion solves the problem of unverified, confidently-wrong AI output. It serves developers and teams shipping LLM-powered products who need a safety layer between their app and the model — without having to build claim verification, risk scoring, or audit logging themselves.

- **Target users:** developers and teams building products on top of Groq/LLM APIs who need to catch hallucinations before they reach end users
- **Pain point:** LLMs hallucinate facts with no built-in way to detect or flag it in real time
- **Value provided:** a drop-in proxy that extracts claims, verifies them, scores hallucination risk (0–100), and acts (pass/warn/block/rewrite) — plus a full audit trail of every response and flagged claim in a graph database

---

## 🧠 Team & Approach

## Team Name

**The Error DeCoders**

## Team Members

**Anushka Tripathi**
[FULL STACK · AI INTEGRATION · NEO4J · SYSTEM
ARCHITECTURE]

- Linkedin- https://www.linkedin.com/in/anushka-tripathi-2a6669380/
- Github- https://github.com/Anushka-Tripathi

**Anushka Chhoker**
[DEVELOPER · UX DESIGN]

- Linkedin- https://www.linkedin.com/in/anushka-c1602b5387hhoker-/
- Github- https://github.com/Anushka-Btech

**Abhinav Sarda**
[BACKEND ENGINEERING · AI INTEGRATION]

- Linkedin- https://www.linkedin.com/in/abhinav-sarda-997251381/
- Github- https://github.com/abhinavsarda11-create

---

### Our Approach:
- Chose this problem because hallucinations are one of the biggest blockers to trusting AI output in production, and there's no lightweight, drop-in safety layer for it
- Key challenge: verifying claims without a static knowledge base — solved by using Groq itself as an independent AI verifier, so it works across any topic instead of being limited to a pre-built FAISS index
- Iterated the frontend through several passes to get a real-time risk meter, claim inspector, and full audit log working with live streaming responses
- Migrated frontend hosting from Netlify to Vercel after running out of build credits

---

## 🛠️ Tech Stack

### Core Technologies Used:
- **Frontend:** React (Vite), Framer Motion, Recharts, Lucide icons, React Router
- **Backend:** FastAPI (Python)
- **Database:** Neo4j AuraDB (graph — Response and Claim nodes)
- **APIs:** Groq API (`llama-3.3-70b-versatile`) — used for the intercepted response, claim extraction, and claim verification
- **Hosting:** Railway (backend), Vercel (frontend)

### Additional Technologies Used:
- [x] AI / ML
- [ ] Web3 / Blockchain
- [ ] Cyber Security
- [x] Cloud

---

## 🏆 Sponsored Track

- [x] **Neo4j Track** – Uses AuraDB as the primary logging database

> Every response processed by the firewall, along with every factual claim extracted from it, is written to Neo4j AuraDB as a graph: `Response` nodes connected to `Claim` nodes, each carrying its own risk/accuracy data. This turns individual hallucination checks into a queryable history — for example, finding the most frequently hallucinated claims across all responses, or the average risk score over time — rather than only looking at one response in isolation.

---

## ✨ Key Features

- ✅ Real-time claim extraction and verification on every LLM response, no static knowledge base required
- ✅ 0–100 hallucination risk scoring with configurable WARN / BLOCK / REWRITE thresholds
- ✅ Live risk meter and claim-by-claim inspector in the chat UI
- ✅ Full audit log with charts, filters, and per-response claim breakdowns
- ✅ Graph-based logging in Neo4j for cross-response hallucination pattern analysis
- ✅ Configurable thresholds via a settings panel — no redeploy needed to tune sensitivity
- ✅ Mobile-responsive dashboard with drawer navigation



---

## 📽️ Demo & Deliverables

- **Demo Video Link (Mandatory):** `[Add link once recorded]`
- **Deployment Link:** https://veridion-pro.vercel.app/ ** 

---


## 🧪 How to Run the Project

### Requirements:
- Python 3.12 (scikit-learn dependency requires this — 3.14 is incompatible)
- Node.js (for the dashboard)
- A free Groq API key: https://console.groq.com/keys
- A Neo4j AuraDB free instance (optional — for audit logging)

### Local Setup:
```bash
# 1. Clone and install backend dependencies
git clone https://github.com/abhinavsarda11-create/hallucination-firewall
cd hallucination-firewall
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env and set:
# GROQ_API_KEY=your_key_here
# NEO4J_ENABLED=true
# NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
# NEO4J_USER=neo4j
# NEO4J_PASSWORD=your_password

# 3. Start the backend (Python 3.12 required)
py -3.12 -m uvicorn backend.main:app --reload

# 4. In a separate terminal, start the dashboard
cd dashboard
npm install
npm run dev
# Dashboard runs at http://localhost:5173

# 5. Point any app you want protected at the proxy instead of Groq directly:
# https://api.groq.com  →  http://localhost:8000/proxy/groq
```

---

## 🧬 Future Scope

- 📈 Support for additional LLM providers beyond Groq (OpenAI intercept already scaffolded)
- 🛡️ Auto-rewrite mode improvements — currently configurable but could use confidence-weighted rewriting
- 🌐 Public API / hosted SaaS version so any team can point their app at Hallucination Firewall without self-hosting
- 🔍 Richer Neo4j graph queries surfaced directly in the dashboard (e.g. "most hallucinated topics" view)

---

## 📎 Resources / Credits

- Groq API (`llama-3.3-70b-versatile`) for generation, claim extraction, and verification
- Neo4j AuraDB Free for graph-based audit logging
- FastAPI, React, Framer Motion, Recharts, Lucide icons

---

## 🏁 Final Words

A drop-in middleware proxy that intercepts every LLM response, verifies factual claims using Groq's world knowledge, and acts in real time — before hallucinations reach your users.
