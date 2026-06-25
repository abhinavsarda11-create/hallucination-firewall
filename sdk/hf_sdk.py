"""
hf_sdk.py — Hallucination Firewall Python SDK (Groq edition).

Usage:
    from sdk.hf_sdk import FirewalledClient

    client = FirewalledClient(api_key="your-groq-key")
    result = client.complete("What year was the Eiffel Tower built?")

    print(result.answer)           # Final answer (corrected if rewritten)
    print(result.risk_score)       # 0–100
    print(result.flagged_claims)   # List of suspicious claim dicts
    print(result.rewritten)        # True if auto-corrected
"""
import os
import httpx
from dataclasses import dataclass, field

FIREWALL_URL  = os.getenv("FIREWALL_URL", "http://localhost:8080")
DEFAULT_MODEL = "llama-3.3-70b-versatile"


@dataclass
class FirewallResponse:
    answer: str
    risk_score: float
    action_taken: str
    flagged_claims: list = field(default_factory=list)
    rewritten: bool = False
    request_id: str = ""
    latency_ms: float = 0.0
    raw: dict = field(default_factory=dict)


class FirewalledClient:
    """
    Drop-in wrapper around the Hallucination Firewall proxy (Groq backend).
    Points at the local proxy instead of Groq's API directly.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        action: str = "WARN",           # WARN | BLOCK | REWRITE
        firewall_url: str = FIREWALL_URL,
    ):
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model = model
        self.action = action
        self.base_url = f"{firewall_url}/proxy/groq"

    def complete(self, prompt: str, system: str = "", max_tokens: int = 1024) -> FirewallResponse:
        """Synchronous completion through the firewall."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.7,
        }

        with httpx.Client(timeout=120) as client:
            resp = client.post(
                f"{self.base_url}/openai/v1/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()

        data = resp.json()
        fw = data.get("firewall", {})

        return FirewallResponse(
            answer=fw.get("final_answer", ""),
            risk_score=fw.get("risk_score", 0.0),
            action_taken=fw.get("action_taken", "PASS"),
            flagged_claims=fw.get("flagged_claims", []),
            rewritten=fw.get("rewritten", False),
            request_id=fw.get("request_id", ""),
            latency_ms=fw.get("latency_ms", 0.0),
            raw=data,
        )

    def health(self) -> dict:
        """Check if the firewall proxy is running and the index is ready."""
        base = self.base_url.replace("/proxy/groq", "")
        with httpx.Client(timeout=10) as client:
            return client.get(f"{base}/health").json()
