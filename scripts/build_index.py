"""
Build the FAISS retrieval index from your knowledge documents.

Run: python scripts/build_index.py

Place .txt or .md files in ./data/knowledge_docs/
The script chunks them, embeds each chunk, and saves index.faiss + metadata.

For the demo: drop in Wikipedia plain-text dumps, textbooks, or any reference material
you want the firewall to verify against.
"""
import os
import json
import glob
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DOCS_PATH = os.getenv("DOCS_PATH", "./data/knowledge_docs/")
INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./data/index.faiss")
META_PATH = INDEX_PATH.replace(".faiss", "_meta.json")
CHUNK_SIZE = 300        # characters per chunk
CHUNK_OVERLAP = 50


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + size, len(text))
        chunks.append(text[start:end].strip())
        start += size - overlap
    return [c for c in chunks if len(c) > 50]   # Drop tiny chunks


def build_index():
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer

    Path(INDEX_PATH).parent.mkdir(parents=True, exist_ok=True)
    Path(DOCS_PATH).mkdir(parents=True, exist_ok=True)

    # Discover docs
    files = glob.glob(f"{DOCS_PATH}/**/*.txt", recursive=True) + \
            glob.glob(f"{DOCS_PATH}/**/*.md", recursive=True)

    if not files:
        logger.warning(f"No .txt or .md files found in {DOCS_PATH}")
        logger.info("Creating a sample knowledge file for demo...")
        _create_sample_docs(DOCS_PATH)
        files = glob.glob(f"{DOCS_PATH}/*.txt")

    logger.info(f"Found {len(files)} document(s).")

    # Chunk all docs
    chunks = []
    meta = []
    for fpath in files:
        with open(fpath, encoding="utf-8", errors="ignore") as f:
            text = f.read()
        doc_chunks = chunk_text(text)
        for chunk in doc_chunks:
            chunks.append(chunk)
            meta.append({"text": chunk, "source": os.path.basename(fpath)})

    logger.info(f"Total chunks: {len(chunks)}. Embedding...")

    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(chunks, normalize_embeddings=True, show_progress_bar=True)
    embeddings = np.array(embeddings, dtype="float32")

    # Build flat inner-product index (cosine similarity since embeddings are normalized)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)
    with open(META_PATH, "w") as f:
        json.dump(meta, f)

    logger.info(f"Index saved: {INDEX_PATH} ({index.ntotal} vectors, dim={dim})")


def _create_sample_docs(path: str):
    """Create a basic knowledge file for demo purposes."""
    sample = """
The Eiffel Tower was constructed between 1887 and 1889 as the centerpiece of the 1889 World's Fair in Paris.
It was designed by engineer Gustave Eiffel and stands 330 meters tall.
The Eiffel Tower receives approximately 7 million visitors per year.

The Python programming language was created by Guido van Rossum and first released in 1991.
Python 3.0 was released in 2008 and is not fully backward compatible with Python 2.

The Apollo 11 mission landed humans on the Moon on July 20, 1969.
Neil Armstrong was the first human to walk on the Moon, followed by Buzz Aldrin.
Michael Collins remained in orbit in the command module Columbia.

Albert Einstein published the special theory of relativity in 1905 and the general theory in 1915.
Einstein was awarded the Nobel Prize in Physics in 1921 for his discovery of the law of the photoelectric effect.

The World Wide Web was invented by Tim Berners-Lee in 1989 while working at CERN.
The first website went live on August 6, 1991.
"""
    with open(os.path.join(path, "sample_facts.txt"), "w") as f:
        f.write(sample.strip())
    logger.info("Sample knowledge file created at data/knowledge_docs/sample_facts.txt")


if __name__ == "__main__":
    build_index()
