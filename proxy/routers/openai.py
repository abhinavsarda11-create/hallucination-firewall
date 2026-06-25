"""
OpenAI proxy router (bonus — works alongside Groq).
Replace https://api.openai.com with http://localhost:8080/proxy/openai
in your app — everything else stays the same.
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

OPENAI_BASE = "https://api.openai.com"
neo4j_log = Neo4jLogger()
extractor = ClaimExtractor()


@router.api_route("/v1/chat/completions", methods=["POST"])
async def proxy_chat(request: Request):
    """Intercept OpenAI chat completions and run Groq-powered firewall checks."""
    request_id = str(uuid.uuid4())[:8]
    body = await request.json()

    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            upstream = await client.post(
                f"{OPENAI_BASE}/v1/chat/completions",
                json=body,
                headers={
                    "Authorization": f"Bearer {os.getenv('OPENAI_API_KEY', '')}",
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

    answer = data["choices"][0]["message"]["content"]
    model = data.get("model", "")
    usage = data.get("usage", {})

    verifier = request.app.state.verifier
    claims = await extractor.extract(answer)
    verifications = await verifier.verify(claims)
    risk_score, flagged_claims = calculate_risk_score(verifications)

    logger.info(f"[{request_id}] risk={risk_score:.0f} claims={len(claims)}")

    result = await decide_action(
        risk_score=risk_score,
        original_answer=answer,
        flagged_claims=flagged_claims,
        request_id=request_id,
        model=model,
        prompt_tokens=usage.get("prompt_tokens", 0),
        completion_tokens=usage.get("completion_tokens", 0),
        latency_ms=latency_ms,
    )

    data["firewall"] = result.model_dump()
    if result.rewritten:
        data["choices"][0]["message"]["content"] = result.final_answer

    return JSONResponse(data)
