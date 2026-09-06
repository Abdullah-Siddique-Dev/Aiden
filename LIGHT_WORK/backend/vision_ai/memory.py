"""
Unknown-object memory — the "teach it a name once, it remembers" feature.
Kept as its own tiny module so server.py stays uncluttered.
"""
import os
import pickle

import numpy as np

MEMORY_PATH = os.path.join(os.path.dirname(__file__), "object_memory.pkl")
MATCH_THRESHOLD = 0.82  # cosine similarity — how close an embedding must be to count as "the same object"


def load_memory() -> list[dict]:
    if os.path.exists(MEMORY_PATH):
        with open(MEMORY_PATH, "rb") as f:
            return pickle.load(f)
    return []  # each entry: {"name": str, "embedding": np.ndarray}


def save_memory(memory: list[dict]) -> None:
    with open(MEMORY_PATH, "wb") as f:
        pickle.dump(memory, f)


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / ((np.linalg.norm(a) * np.linalg.norm(b)) + 1e-8))


def find_match(embedding: np.ndarray, memory: list[dict]) -> tuple[str | None, float]:
    """Best-matching saved name for this embedding, or (None, best_similarity_seen)."""
    best_name, best_sim = None, -1.0
    for entry in memory:
        sim = cosine_sim(embedding, entry["embedding"])
        if sim > best_sim:
            best_sim, best_name = sim, entry["name"]
    if best_sim >= MATCH_THRESHOLD:
        return best_name, best_sim
    return None, best_sim


def remember(name: str, embedding: np.ndarray) -> None:
    memory = load_memory()
    memory.append({"name": name, "embedding": embedding})
    save_memory(memory)
