"""
Action engine.
Decides what to do with a response based on its risk score and config.
WARN   — pass through, attach risk metadata
BLOCK  — return error payload, don't pass answer to app
REWRITE — ask Groq to correct flagged claims, return corrected answer
"""
import os
import logging
import httpx
from proxy.models import Action, FlaggedClaim, FirewallResult

logger = logging.getLogger(__name__)

WARN_THRESHOLD      = float(os.getenv("HF_WARN_THRESHOLD", 40))
BLOCK_THRESHOLD     = float(os.getenv("HF_BLOCK_THRESHOLD", 75))
REWRITE_THRESHOLD   = float(os.getenv("HF_REWRITE_THRESHOLD", 60))
CONFIGURED_ACTION   = os.getenv("HF_ACTION", "WARN")

GROQ_BASE     = "https://api.groq.com/openai/v1"
REWRITE_MODEL = "llama-3.3-70b-versatile"

REWRITE_PROMPT = """The following text contains potentially inaccurate claims.
Flagged claims with their issues:
{flagged}

Original text:
{text}

Rewrite the text correcting or removing the flagged claims.
Return only the corrected text, no explanation, no preamble."""


async def decide_action(
    risk_score: float,
    original_answer: str,
    flagged_claims: list[FlaggedClaim],
    request_id: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: float,
) -> FirewallResult:
    """Apply WARN / BLOCK / REWRITE logic and return the final FirewallResult."""

    action = _resolve_action(risk_score)
    final_answer = original_answer
    rewritten = False

    if action == Action.BLOCK:
        final_answer = (
            f"[BLOCKED] This response was blocked by the Hallucination Firewall "
            f"(risk score: {risk_score:.0f}/100). "
            "The response contained claims that could not be verified."
        )

    elif action == Action.REWRITE and flagged_claims:
        logger.info(f"[{request_id}] Rewriting response (risk={risk_score:.0f})")
        corrected = await _rewrite(original_answer, flagged_claims)
        if corrected:
            final_answer = corrected
            rewritten = True

    return FirewallResult(
        request_id=request_id,
        original_answer=original_answer,
        final_answer=final_answer,
        risk_score=risk_score,
        action_taken=action,
        flagged_claims=flagged_claims,
        rewritten=rewritten,
        latency_ms=latency_ms,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
    )


def _resolve_action(risk_score: float) -> Action:
    if CONFIGURED_ACTION == "BLOCK" and risk_score >= BLOCK_THRESHOLD:
        return Action.BLOCK
    if CONFIGURED_ACTION == "REWRITE" and risk_score >= REWRITE_THRESHOLD:
        return Action.REWRITE
    if risk_score >= WARN_THRESHOLD:
        return Action.WARN
    return Action.PASS


async def _rewrite(text: str, flagged: list[FlaggedClaim]) -> str | None:
    """Ask Groq to rewrite the response, correcting flagged claims."""
    try:
        api_key = os.getenv("GROQ_API_KEY", "")
        flagged_str = "\n".join(
            f'- "{c.text}" ({c.reason})' for c in flagged
        )
        payload = {
            "model": REWRITE_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": REWRITE_PROMPT.format(flagged=flagged_str, text=text)
                }
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{GROQ_BASE}/chat/completions",
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error(f"Rewrite failed: {e}")
        return None
