"""Shared data models for the firewall."""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class Action(str, Enum):
    WARN = "WARN"
    BLOCK = "BLOCK"
    REWRITE = "REWRITE"
    PASS = "PASS"


class FlaggedClaim(BaseModel):
    text: str
    risk_score: float = Field(..., ge=0, le=100)
    reason: str
    suggested_correction: Optional[str] = None


class FirewallResult(BaseModel):
    """Returned to the calling app alongside (or instead of) the LLM answer."""
    request_id: str
    original_answer: str
    final_answer: str                       # Same as original unless rewritten
    risk_score: float = Field(..., ge=0, le=100)
    action_taken: Action
    flagged_claims: list[FlaggedClaim] = []
    rewritten: bool = False
    latency_ms: float = 0.0
    model: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
