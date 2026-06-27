"""
Verifier - works with FAISS or keyword fallback, no extra packages needed.
"""
import os
import re
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./data/index.faiss")
DOCS_META_PATH   = FAISS_INDEX_PATH.replace(".faiss", "_meta.json")
DOCS_PATH        = os.getenv("DOCS_PATH", "./data/knowledge_docs/")
NO_INDEX_SCORE   = 35.0


class VerificationResult:
    def __init__(self, claim, score, best_match, match_distance):
        self.claim = claim
        self.score = score
        self.best_match = best_match
        self.match_distance = match_distance


class Verifier:
    def __init__(self):
        self.index = None
        self.meta = []
        self.model = None
        self._ready = False
        self._docs = []

    async def load(self):
        self._load_text_docs()
        try:
            import faiss
            from sentence_transformers import SentenceTransformer
            if not Path(FAISS_INDEX_PATH).exists():
                logger.warning("FAISS index not found - using keyword fallback.")
                return
            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(DOCS_META_PATH) as f:
                self.meta = json.load(f)
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            self._ready = True
            logger.info(f"Verifier ready (FAISS) - {self.index.ntotal} chunks.")
        except ImportError:
            logger.info("faiss not installed - using keyword fallback.")
        except Exception as e:
            logger.warning(f"FAISS load error: {e} - using keyword fallback.")

    def _load_text_docs(self):
        docs_dir = Path(DOCS_PATH)
        if not docs_dir.exists():
            return
        for f in docs_dir.glob("*.txt"):
            try:
                self._docs.append(f.read_text(encoding="utf-8").lower())
            except Exception:
                pass
        logger.info(f"Keyword verifier loaded {len(self._docs)} document(s).")

    def _keyword_score(self, claim):
        if not self._docs:
            return NO_INDEX_SCORE, "No knowledge documents loaded"
        words = set(re.findall(r'\b\w{4,}\b', claim.lower()))
        if not words:
            return NO_INDEX_SCORE, "Could not parse claim"
        best_score = 0.0
        best_match = ""
        for doc in self._docs:
            sentences = re.split(r'[.!?\n]', doc)
            for sent in sentences:
                sent = sent.strip()
                if not sent:
                    continue
                sent_words = set(re.findall(r'\b\w{4,}\b', sent))
                if not sent_words:
                    continue
                overlap = len(words & sent_words) / len(words)
                score = overlap * 100
                if score > best_score:
                    best_score = score
                    best_match = sent
        return best_score, best_match or "No matching evidence found"

    async def verify(self, claims):
        if not claims:
            return []
        if self._ready:
            try:
                import numpy as np
                embeddings = self.model.encode(claims, normalize_embeddings=True)
                embeddings = np.array(embeddings, dtype="float32")
                distances, indices = self.index.search(embeddings, k=1)
                results = []
                for i, claim in enumerate(claims):
                    dist = float(distances[i][0])
                    idx = int(indices[i][0])
                    best = self.meta[idx]["text"] if 0 <= idx < len(self.meta) else "unknown"
                    results.append(VerificationResult(claim=claim, score=dist*100, best_match=best, match_distance=dist))
                return results
            except Exception as e:
                logger.error(f"FAISS verify error: {e} - falling back to keyword.")
        results = []
        for claim in claims:
            score, match = self._keyword_score(claim)
            logger.info(f"Keyword score for claim: {score:.1f}")
            results.append(VerificationResult(claim=claim, score=score, best_match=match, match_distance=score/100))
        return results