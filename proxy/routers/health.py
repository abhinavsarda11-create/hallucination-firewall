from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/health")
async def health(request: Request):
    verifier = getattr(request.app.state, "verifier", None)
    index_ready = verifier._ready if verifier else False
    return JSONResponse({
        "status": "ok",
        "index_ready": index_ready,
        "index_size": verifier.index.ntotal if index_ready and verifier.index else 0,
    })
