"""
Claim extractor.
Uses Groq (llama-3.3-70b-versatile, fast + cheap) to pull every verifiable
factual claim from an LLM response as structured JSON.
"""
import os
import json
import logging
import httpx

logger = logging.getLogger(__name__)

GROQ_BASE = "https://api.groq.com/openai/v1"
EXTRACTOR_MODEL = "llama-3.3-70b-versatile"

EXTRACTION_PROMPT = """You are a fact-checking assistant. Given a text, extract every
verifiable factual claim — statements that could be checked against a reference source.

Return ONLY a JSON array. No preamble, no markdown fences, no explanation.
Each element: { "claim": "...", "checkable": true/false }

Only include claims where checkable=true (skip opinions, hypotheticals, advice).

Text to analyse:
{text}"""


class ClaimExtractor:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")

    async def extract(self, text: str) -> list[str]:
        """Return a list of checkable factual claims from text."""
        try:
            payload = {
                "model": EXTRACTOR_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": EXTRACTION_PROMPT.format(text=text)
                    }
                ],
                "temperature": 0.0,
                "max_tokens": 512,
            }
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{GROQ_BASE}/chat/completions",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                )
                resp.raise_for_status()

            data = resp.json()
            raw = data["choices"][0]["message"]["content"].strip()

            # Strip markdown fences if model adds them
            raw = raw.replace("```json", "").replace("```", "").strip()
            claims_data = json.loads(raw)

            return [
                item["claim"]
                for item in claims_data
                if item.get("checkable", False)
            ]

        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.warning(f"Claim extraction parse error: {e}")
            return []
        except Exception as e:
            logger.error(f"Claim extraction failed: {e}")
            return []
