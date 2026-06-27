"""
Verifier.
Checks claims against a FAISS index if available.
Falls back gracefully if faiss/sentence-transformers not installed.
"""
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./data/index.faiss")
DOCS_META_PATH   = FAISS_INDEX_PATH.replace(".faiss", "_meta.json")
NO_INDEX_SCORE   = 35.0


class VerificationResult:
    def __init__(self, claim: str, score: float, best_match: str, match_distance: float):
        self.claim = claim
        self.score = score
        self.best_match = best_match
        self.match_distance = match_distance


class Verifier:
    def __init__(self):
        self.index = None
        self.meta  = []
        self.model = None
        self._ready = False

    async def load(self):
        try:
            import faiss
            import json
            from sentence_transformers import SentenceTransformer

            if not Path(FAISS_INDEX_PATH).exists():
                logger.warning("FAISS index not found - using uncertain scores.")
                return

            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(DOCS_META_PATH) as f:
                self.meta = json.load(f)
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            self._ready = True
            logger.info(f"Verifier ready - {self.index.ntotal} indexed chunks.")

        except ImportError:
            logger.warning("faiss-cpu or sentence-transformers not installed - using uncertain scores.")
        except Exception as e:
            logger.warning(f"Verifier load error: {e} - using uncertain scores.")

    async def verify(self, claims: list[str]) -> list[VerificationResult]:
        if not claims:
            return []

        if not self._ready:
            logger.info(f"Verifier not ready - scoring {len(claims)} claims as uncertain ({NO_INDEX_SCORE})")
            return [
                VerificationResult(
                    claim=c,
                    score=NO_INDEX_SCORE,
                    best_match="No knowledge index loaded",
                    match_distance=0.0,
                )
                for c in claims
            ]

        try:
            import numpy as np
            embeddings = self.model.encode(claims, normalize_embeddings=True)
            embeddings = np.array(embeddings, dtype="float32")
            distances, indices = self.index.search(embeddings, k=1)
            results = []
            for i, claim in enumerate(claims):
                dist = float(distances[i][0])
                idx  = int(indices[i][0])
                best = self.meta[idx]["text"] if 0 <= idx < len(self.meta) else "unknown"
                results.append(VerificationResult(claim=claim, score=dist * 100, best_match=best, match_distance=dist))
            return results
        except Exception as e:
            logger.error(f"Verification error: {e}")
            return [VerificationResult(claim=c, score=NO_INDEX_SCORE, best_match="error", match_distance=0.0) for c in claims]