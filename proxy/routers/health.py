import os
import logging
from fastapi import APIRouter, Request

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health(request: Request):
    verifier  = getattr(request.app.state, "verifier",  None)
    neo4j_log = getattr(request.app.state, "neo4j_log", None)
    key = os.getenv("GROQ_API_KEY", "")

    neo4j_stats = {}
    if neo4j_log:
        try: neo4j_stats = neo4j_log.get_stats()
        except Exception: neo4j_stats = {"enabled": False}

    return {
        "status":         "ok",
        "groq_key_set":   bool(key),
        "groq_key_prefix": key[:8] + "..." if key else "NOT SET",
        "verifier_ready": getattr(verifier, "_ready", False),
        "docs_loaded":    len(getattr(verifier, "_docs", [])),
        "neo4j":          neo4j_stats,
    }

@router.get("/stats")
async def stats(request: Request):
    """Top hallucinated claims from Neo4j graph."""
    neo4j_log = getattr(request.app.state, "neo4j_log", None)
    if not neo4j_log:
        return {"error": "Neo4j not initialised"}
    return {
        "stats":      neo4j_log.get_stats(),
        "top_claims": neo4j_log.get_top_hallucinated_claims(10),
    }
