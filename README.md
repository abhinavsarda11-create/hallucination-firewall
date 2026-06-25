# Hallucination Firewall 🛡️
### Powered by Groq

> Drop-in middleware that intercepts LLM responses, extracts verifiable claims,
> scores hallucination risk, and returns a full audit payload.

## What it does

```
Your App  →  Hallucination Firewall  →  Groq API
                     ↓
     { answer, risk_score, flagged_claims[], rewritten? }
```

- **Intercepts** every Groq response before it reaches your app
- **Extracts** all factual claims using Groq (`llama-3.3-70b-versatile`, fast + cheap)
- **Verifies** claims against a FAISS retrieval index
- **Scores** hallucination risk 0–100 per response
- **Acts**: WARN / BLOCK / REWRITE based on your config
- **Logs** to Neo4j as a claim→source knowledge graph (optional)

## Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set your Groq API key
cp .env.example .env
# Edit .env → GROQ_API_KEY=your_key_here
# Get a free key at: https://console.groq.com/keys

# 3. Build the knowledge index
python scripts/build_index.py

# 4. Start the proxy
uvicorn proxy.main:app --reload --port 8080

# 5. Point your app at the proxy
# Change: https://api.groq.com
#     To: http://localhost:8080/proxy/groq
```

## One-line SDK usage

```python
from sdk.hf_sdk import FirewalledClient

client = FirewalledClient(api_key="your-groq-key")
result = client.complete("Einstein invented the telephone in 1876.")

print(result.answer)           # Final answer (corrected if rewritten)
print(result.risk_score)       # e.g. 87.0
print(result.flagged_claims)   # [{"text": "Einstein invented the telephone...", ...}]
print(result.rewritten)        # True if auto-corrected
```

## Demo script

```python
from sdk.hf_sdk import FirewalledClient

client = FirewalledClient(api_key="your-key", action="REWRITE")

# This should get flagged AND rewritten
result = client.complete("Apollo 11 landed on Mars in 1969, piloted by Neil Armstrong.")
print("Risk score :", result.risk_score)
print("Flagged    :", [c["text"] for c in result.flagged_claims])
print("Rewritten? :", result.rewritten)
print("Final answer:", result.answer)
```

## Dashboard

```bash
cd dashboard
npm install
npm run dev   # http://localhost:5173
```

## Project structure

```
hallucination-firewall/
├── proxy/
│   ├── main.py                  # FastAPI app entry point
│   ├── routers/
│   │   ├── groq.py              # /proxy/groq  ← main intercept
│   │   └── openai.py            # /proxy/openai  ← bonus intercept
│   ├── core/
│   │   ├── extractor.py         # Claim extraction (Groq llama-3.3-70b)
│   │   ├── verifier.py          # FAISS cosine similarity
│   │   ├── scorer.py            # 0–100 risk score
│   │   ├── action.py            # WARN / BLOCK / REWRITE (Groq)
│   │   └── neo4j_logger.py      # Graph logging (optional)
│   └── models/__init__.py       # Pydantic models
├── sdk/hf_sdk.py                # Python SDK
├── dashboard/                   # React audit explorer
├── scripts/build_index.py       # FAISS index builder
└── tests/test_e2e.py
```

## Models used

| Purpose | Model |
|---|---|
| Main proxy (intercepted) | Any Groq model you choose |
| Claim extraction | `llama-3.3-70b-versatile` (fast) |
| Rewriting | `llama-3.3-70b-versatile` |
