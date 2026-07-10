"""
Groq-powered verifier.
Uses Groq itself to verify each claim — no sample_facts.txt needed.
Works for ANY topic automatically.
"""
import os, json, logging, httpx
logger = logging.getLogger(__name__)
GROQ_BASE = "https://api.groq.com/openai/v1"

VERIFY_PROMPT = """You are a fact-checking assistant. Determine if this claim is factually accurate.

Claim: "{claim}"

Respond ONLY with this JSON (no markdown):
{{"accurate": true/false, "confidence": 0-100, "reason": "one sentence"}}"""


class VerificationResult:
    def __init__(self, claim, score, best_match, match_distance):
        self.claim = claim
        self.score = score
        self.best_match = best_match
        self.match_distance = match_distance


class Verifier:
    def __init__(self):
        self._ready = False
        self._docs = []

    async def load(self):
        if os.getenv("GROQ_API_KEY", "").strip():
            self._ready = True
            logger.info("Groq-powered verifier ready - no index needed.")
        else:
            logger.error("GROQ_API_KEY not set.")

    async def verify(self, claims: list[str]) -> list[VerificationResult]:
        if not claims:
            return []
        if not self._ready:
            return [VerificationResult(c, 35.0, "Verifier not ready", 0.0) for c in claims]
        results = []
        for claim in claims:
            results.append(await self._verify_one(claim))
        return results

    async def _verify_one(self, claim: str) -> VerificationResult:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(
                    f"{GROQ_BASE}/chat/completions",
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [{"role": "user", "content": VERIFY_PROMPT.format(claim=claim)}],
                        "temperature": 0.0, "max_tokens": 150,
                    },
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                )
                resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
            raw = raw.replace("```json","").replace("```","").strip()
            data = json.loads(raw)
            accurate = data.get("accurate", True)
            confidence = float(data.get("confidence", 50))
            reason = data.get("reason", "")
            score = (50 + confidence / 2) if accurate else (50 - confidence / 2)
            logger.info(f"Claim: '{claim[:50]}' accurate={accurate} confidence={confidence} score={score:.1f}")
            return VerificationResult(claim, score, reason, score/100)
        except json.JSONDecodeError as e:
            logger.warning(f"Parse error: {e}")
            return VerificationResult(claim, 50.0, "Could not parse response", 0.5)
        except Exception as e:
            logger.error(f"Verify failed: {e}")
            return VerificationResult(claim, 50.0, str(e), 0.5)