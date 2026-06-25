"""
Verifier.
Embeds each claim using sentence-transformers and checks cosine similarity
against a FAISS index built from your knowledge documents.
Returns a verification score per claim (0.0 = no evidence, 1.0 = strong match).
"""
import os
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./data/index.faiss")
DOCS_META_PATH = os.getenv("FAISS_INDEX_PATH", "./data/index.faiss").replace(".faiss", "_meta.json")


class VerificationResult:
    def __init__(self, claim: str, score: float, best_match: str, match_distance: float):
        self.claim = claim
        self.score = score                  # 0–100, higher = more verified
        self.best_match = best_match        # The closest document chunk
        self.match_distance = match_distance


class Verifier:
    def __init__(self):
        self.index = None
        self.meta = []
        self.model = None
        self._ready = False

    async def load(self):
        """Load FAISS index and embedding model. Called once at startup."""
        try:
            import faiss
            import json
            from sentence_transformers import SentenceTransformer

            if not Path(FAISS_INDEX_PATH).exists():
                logger.warning(
                    f"FAISS index not found at {FAISS_INDEX_PATH}. "
                    "Run: python scripts/build_index.py\n"
                    "Verifier will return neutral scores (50) until index is built."
                )
                return

            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(DOCS_META_PATH) as f:
                self.meta = json.load(f)

            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            self._ready = True
            logger.info(f"Verifier ready — {self.index.ntotal} indexed chunks.")

        except ImportError as e:
            logger.error(f"Missing dependency: {e}. pip install faiss-cpu sentence-transformers")
        except Exception as e:
            logger.error(f"Verifier load error: {e}")

    async def verify(self, claims: list[str]) -> list[VerificationResult]:
        """Verify each claim against the index. Returns one result per claim."""
        if not self._ready or not claims:
            # Return neutral if index not loaded
            return [
                VerificationResult(c, score=50.0, best_match="index not loaded", match_distance=1.0)
                for c in claims
            ]

        embeddings = self.model.encode(claims, normalize_embeddings=True)
        embeddings = np.array(embeddings, dtype="float32")

        # k=1: just the best match per claim
        distances, indices = self.index.search(embeddings, k=1)

        results = []
        for i, claim in enumerate(claims):
            dist = float(distances[i][0])   # Inner product (cosine) since normalized
            idx = int(indices[i][0])
            best_match = self.meta[idx]["text"] if 0 <= idx < len(self.meta) else "unknown"

            # Convert cosine similarity (0–1) → risk contribution (0–100)
            # High similarity = evidence found = low risk
            # Low similarity = no evidence = high risk
            verification_score = dist * 100   # 0 = no match, 100 = perfect match

            results.append(VerificationResult(
                claim=claim,
                score=verification_score,
                best_match=best_match,
                match_distance=dist,
            ))

        return results
