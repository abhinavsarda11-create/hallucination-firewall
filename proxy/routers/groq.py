"""
Groq proxy router — intercepts chat completions and runs the hallucination pipeline.
"""
import os
import time
import uuid
import logging
import httpx
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from proxy.core.extractor import ClaimExtractor
from proxy.core.scorer    import calculate_risk_score
from proxy.core.action    import decide_action

logger = logging.getLogger(__name__)
router = APIRouter()
extractor = ClaimExtractor()

GROQ_BASE = "https://api.groq.com"


@router.api_route("/openai/v1/chat/completions", methods=["POST"])
async def proxy_chat(request: Request):
    request_id = str(uuid.uuid4())[:8]
    body       = await request.json()
    api_key    = os.getenv("GROQ_API_KEY", "").strip()

    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    # ── 1. Forward to Groq ────────────────────────────────────────
    t0 = time.time()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            upstream = await client.post(
                f"{GROQ_BASE}/openai/v1/chat/completions",
                json=body,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            )
        upstream.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"[{request_id}] Groq error: {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail=str(e))
    except httpx.RequestError as e:
        logger.error(f"[{request_id}] Groq connection error: {e}")
        raise HTTPException(status_code=502, detail=f"Cannot reach Groq: {e}")

    latency_ms = (time.time() - t0) * 1000
    data = upstream.json()

    answer = _extract_text(data)
    if not answer:
        logger.warning(f"[{request_id}] Empty answer from Groq")
        return JSONResponse(data)

    model            = data.get("model", body.get("model", ""))
    usage            = data.get("usage", {})
    prompt_tokens    = usage.get("prompt_tokens", 0)
    completion_tokens = usage.get("completion_tokens", 0)

    logger.info(f"[{request_id}] Got Groq response ({len(answer)} chars) — running pipeline")

    # ── 2. Extract claims ─────────────────────────────────────────
    claims = await extractor.extract(answer)
    logger.info(f"[{request_id}] Extracted {len(claims)} claims: {claims[:3]}")

    # ── 3. Verify claims ──────────────────────────────────────────
    verifier      = request.app.state.verifier
    verifications = await verifier.verify(claims)

    # ── 4. Score ──────────────────────────────────────────────────
    risk_score, flagged_claims = calculate_risk_score(verifications)
    logger.info(f"[{request_id}] risk={risk_score:.1f} flagged={len(flagged_claims)}")

    # ── 5. Decide action ──────────────────────────────────────────
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
    logger.info(f"[{request_id}] action={result.action_taken} rewritten={result.rewritten}")

    # ── 6. Log to Neo4j ───────────────────────────────────────────
    neo4j_log = getattr(request.app.state, "neo4j_log", None)
    if neo4j_log:
        try:
            neo4j_log.log(result, _extract_prompt(body))
        except Exception as e:
            logger.warning(f"[{request_id}] Neo4j log failed: {e}")

    # ── 7. Return enriched response ───────────────────────────────
    data["firewall"] = result.model_dump()
    if result.rewritten:
        try:
            data["choices"][0]["message"]["content"] = result.final_answer
        except (KeyError, IndexError):
            pass

    return JSONResponse(data)


def _extract_text(data: dict) -> str:
    try: return data["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError): return ""


def _extract_prompt(body: dict) -> str:
    try:
        for msg in reversed(body.get("messages", [])):
            if msg.get("role") == "user":
                c = msg.get("content", "")
                return c if isinstance(c, str) else " ".join(p.get("text","") for p in c if "text" in p)
    except Exception:
        pass
    return ""
