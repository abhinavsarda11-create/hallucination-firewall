import os, json, logging, httpx, re
logger = logging.getLogger(__name__)
GROQ_BASE = "https://api.groq.com/openai/v1"

class ClaimExtractor:
    async def extract(self, text: str) -> list[str]:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key or not text.strip():
            return self._fallback(text)
        try:
            prompt = f"""List every verifiable fact in this text as a JSON array.
Format: [{{"claim": "fact here", "checkable": true}}]
Return ONLY the JSON array, nothing else.
Text: {text.strip()[:1000]}"""
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{GROQ_BASE}/chat/completions",
                    json={"model": "llama-3.3-70b-versatile", "messages": [{"role": "user", "content": prompt}], "temperature": 0.0, "max_tokens": 512},
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                )
                resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
            logger.info(f"Extractor raw: {raw[:100]}")
            # Strip markdown
            raw = re.sub(r"```json|```", "", raw).strip()
            # Find JSON array
            start, end = raw.find("["), raw.rfind("]") + 1
            if start == -1 or end == 0:
                logger.warning(f"No JSON array found, using fallback. Raw: {raw[:50]}")
                return self._fallback(text)
            data = json.loads(raw[start:end])
            claims = [i["claim"] for i in data if isinstance(i, dict) and i.get("checkable", False)]
            logger.info(f"Extracted {len(claims)} claims: {claims}")
            return claims
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parse error: {e} — using fallback")
            return self._fallback(text)
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return self._fallback(text)

    def _fallback(self, text: str) -> list[str]:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        skip = ("i ", "you ", "we ", "please ", "if ", "this ", "that ", "it ")
        claims = [s.strip() for s in sentences if len(s.strip()) > 20 and not s.lower().startswith(skip) and "?" not in s]
        logger.info(f"Fallback extracted {len(claims)} claims")
        return claims[:5]