"""
Hallucination Firewall — proxy server entry point.
Run: uvicorn proxy.main:app --reload --port 8080
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from dotenv import load_dotenv
load_dotenv()

from proxy.core.verifier import Verifier
from proxy.routers import groq, openai, health

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading retrieval index...")
    app.state.verifier = Verifier()
    await app.state.verifier.load()
    logger.info("Retrieval index ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Hallucination Firewall",
    description="Drop-in LLM proxy with hallucination detection. Powered by Groq.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(groq.router,   prefix="/proxy/groq")
app.include_router(openai.router, prefix="/proxy/openai")
