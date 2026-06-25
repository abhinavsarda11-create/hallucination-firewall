"""
Groq proxy router.
Replace https://api.groq.com with http://localhost:8080/proxy/groq
in your app — everything else stays the same.

Supports: POST /openai/v1/chat/completions
"""
import os
import time
import uuid
import logging
import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from proxy.core.extractor import ClaimExtractor
from proxy.core.scorer import calculate_risk_score
from proxy.core.action import decide_action
from proxy.core.neo4j_logger import Neo4jLogger

logger = logging.getLogger(__name__)
router = APIRouter()

GROQ_BASE = "https://api.groq.com"
neo4j_log = Neo4jLogger()
extractor = ClaimExtractor()


@router.api_route("/openai/v1/chat/completions", methods=["POST"])
async def proxy_chat(request: Request):
    """
    Intercept Groq chat completion calls, run firewall checks,
    and return the enriched payload.
    """
    request_id = str(uuid.uuid4())[:8]
    body = await request.json()
    api_key = os.getenv("GROQ_API_KEY", "")

    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            upstream = await client.post(
                f"{GROQ_BASE}/openai/v1/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
        upstream.raise_for_status()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")

    latency_ms = (time.time() - t0) * 1000
    data = upstream.json()

    answer = _extract_text(data)
    if not answer:
        return JSONResponse(data)

    model = data.get("model", body.get("model", ""))
    usage = data.get("usage", {})
    prompt_tokens = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)

    verifier = request.app.state.verifier
    claims = await extractor.extract(answer)
    verifications = await verifier.verify(claims)
    risk_score, flagged_claims = calculate_risk_score(verifications)

    logger.info(f"[{request_id}] risk={risk_score:.0f} claims={len(claims)} flagged={len(flagged_claims)}")

    result = await decide_action(
        risk_score=risk_score,
        original_answer=answer,
        flagged_claims=flagged_claims,
        request_id=request_id,
        model=model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        latency_ms=latency_ms,
    )

    try:
        neo4j_log.log(result, _extract_prompt(body))
    except Exception:
        pass

    # Inject firewall metadata into upstream response
    data["firewall"] = result.model_dump()
    if result.rewritten:
        try:
            data["choices"][0]["message"]["content"] = result.final_answer
        except (KeyError, IndexError):
            pass

    return JSONResponse(data)


def _extract_text(data: dict) -> str:
    """Pull plain text from Groq chat completion response."""
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError):
        return ""


def _extract_prompt(body: dict) -> str:
    """Pull the last user message from Groq request body."""
    try:
        messages = body.get("messages", [])
        for msg in reversed(messages):
            if msg.get("role") == "user":
                content = msg.get("content", "")
                if isinstance(content, str):
                    return content
                if isinstance(content, list):
                    return " ".join(p.get("text", "") for p in content if "text" in p)
    except Exception:
        pass
    return ""
