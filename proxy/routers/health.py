import os
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "groq_key_set": bool(os.getenv("GROQ_API_KEY")),
        "groq_key_prefix": os.getenv("GROQ_API_KEY", "")[:8] + "..." if os.getenv("GROQ_API_KEY") else "NOT SET",
        "index_exists": Path("./data/index.faiss").exists(),
        "index_path": str(Path("./data/index.faiss").absolute()),
    }