"""
Hallucination Firewall — proxy server entry point.
"""
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()  # Must be FIRST — loads .env before anything reads os.getenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from proxy.core.verifier    import Verifier
from proxy.core.neo4j_logger import Neo4jLogger
from proxy.routers import groq, openai, health

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    import os

    # ── Groq key check ────────────────────────────────────────────
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        logger.error("⚠️  GROQ_API_KEY is not set! Check your .env / Railway variables.")
    else:
        logger.info(f"✅ GROQ_API_KEY loaded (starts with: {key[:8]}...)")

    # ── Verifier ──────────────────────────────────────────────────
    logger.info("Loading verifier...")
    app.state.verifier = Verifier()
    await app.state.verifier.load()

    if app.state.verifier._ready:
        logger.info("✅ Verifier ready (Groq-powered)")
    else:
        logger.warning("⚠️  Verifier not ready — check GROQ_API_KEY")

    # ── Neo4j ─────────────────────────────────────────────────────
    neo4j_enabled = os.getenv("NEO4J_ENABLED", "false").lower() == "true"
    if neo4j_enabled:
        logger.info("Connecting to Neo4j...")
        app.state.neo4j_log = Neo4jLogger()
        app.state.neo4j_log._get_driver()   # trigger connection now
        stats = app.state.neo4j_log.get_stats()
        if stats.get("enabled"):
            logger.info(f"✅ Neo4j connected — {stats.get('total_responses',0)} responses in graph")
        else:
            logger.warning("⚠️  Neo4j failed to connect — logging disabled")
    else:
        logger.info("Neo4j disabled (NEO4J_ENABLED=false)")
        app.state.neo4j_log = Neo4jLogger()   # no-op logger

    yield

    # ── Shutdown ──────────────────────────────────────────────────
    if hasattr(app.state, "neo4j_log"):
        app.state.neo4j_log.close()
    logger.info("Shutdown complete.")


app = FastAPI(
    title="Veridion",
    description="Drop-in LLM proxy with AI-powered hallucination detection.",
    version="2.0.0",
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
