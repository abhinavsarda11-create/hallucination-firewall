import os
import logging
from pathlib import Path
from fastapi import APIRouter, Request

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/health")
async def health(request: Request):
    verifier = getattr(request.app.state, "verifier", None)
    docs_loaded = len(getattr(verifier, "_docs", [])) if verifier else 0
    index_ready = getattr(verifier, "_ready", False) if verifier else False
    key = os.getenv("GROQ_API_KEY", "")
    return {
        "status": "ok",
        "groq_key_set": bool(key),
        "groq_key_prefix": key[:8] + "..." if key else "NOT SET",
        "index_ready": index_ready,
        "docs_loaded": docs_loaded,
        "docs_path_exists": Path(os.getenv("DOCS_PATH", "./data/knowledge_docs/")).exists(),
    }