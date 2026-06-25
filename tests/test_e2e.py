"""
End-to-end tests for the Hallucination Firewall (Groq edition).
Run: pytest tests/ -v
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ─── Unit: Claim Extractor ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_extractor_returns_list():
    """ClaimExtractor should return a list of strings."""
    from proxy.core.extractor import ClaimExtractor

    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": '[{"claim": "Paris is the capital of France", "checkable": true}]'}}]
    }
    mock_resp.raise_for_status = MagicMock()

    extractor = ClaimExtractor()
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_resp)
        claims = await extractor.extract("Paris is the capital of France.")

    assert isinstance(claims, list)
    assert len(claims) == 1
    assert "Paris" in claims[0]


@pytest.mark.asyncio
async def test_extractor_handles_bad_json():
    """Extractor should return empty list on malformed JSON."""
    from proxy.core.extractor import ClaimExtractor

    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": "not json at all"}}]
    }
    mock_resp.raise_for_status = MagicMock()

    extractor = ClaimExtractor()
    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_resp)
        claims = await extractor.extract("some text")

    assert claims == []


# ─── Unit: Scorer ─────────────────────────────────────────────────────────────

def test_scorer_empty_verifications():
    from proxy.core.scorer import calculate_risk_score
    score, flagged = calculate_risk_score([])
    assert score == 0.0
    assert flagged == []


def test_scorer_high_risk_claim():
    from proxy.core.scorer import calculate_risk_score
    from proxy.core.verifier import VerificationResult

    low_evidence = VerificationResult(
        claim="The Moon is made of cheese",
        score=5.0,
        best_match="",
        match_distance=0.05
    )
    score, flagged = calculate_risk_score([low_evidence])
    assert score > 60
    assert len(flagged) == 1


def test_scorer_low_risk_claim():
    from proxy.core.scorer import calculate_risk_score
    from proxy.core.verifier import VerificationResult

    high_evidence = VerificationResult(
        claim="The Eiffel Tower is in Paris",
        score=92.0,
        best_match="The Eiffel Tower is located in Paris, France.",
        match_distance=0.92
    )
    score, flagged = calculate_risk_score([high_evidence])
    assert score < 20
    assert len(flagged) == 0


# ─── Unit: Action Engine ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_action_warn():
    from proxy.core.action import decide_action
    from proxy.models import Action

    result = await decide_action(
        risk_score=50.0,
        original_answer="Some answer with moderate risk.",
        flagged_claims=[],
        request_id="test-001",
        model="llama-3.3-70b-versatile",
        prompt_tokens=10,
        completion_tokens=20,
        latency_ms=500,
    )
    assert result.action_taken == Action.WARN
    assert result.final_answer == "Some answer with moderate risk."
    assert result.rewritten is False


@pytest.mark.asyncio
async def test_action_block():
    import os
    from proxy.core.action import decide_action
    from proxy.models import Action

    with patch.dict(os.environ, {"HF_ACTION": "BLOCK", "HF_BLOCK_THRESHOLD": "70"}):
        result = await decide_action(
            risk_score=80.0,
            original_answer="Dangerous hallucination here.",
            flagged_claims=[],
            request_id="test-002",
            model="llama-3.3-70b-versatile",
            prompt_tokens=10,
            completion_tokens=20,
            latency_ms=500,
        )
    assert result.action_taken == Action.BLOCK
    assert "BLOCKED" in result.final_answer


# ─── Integration: Full pipeline (mocked Groq) ────────────────────────────────

@pytest.mark.asyncio
async def test_full_pipeline_neutral_verifier():
    """Without a loaded index, verifier returns neutral 50 — score should be ~50."""
    from proxy.core.extractor import ClaimExtractor
    from proxy.core.verifier import Verifier
    from proxy.core.scorer import calculate_risk_score

    extractor = ClaimExtractor()
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": '[{"claim": "Water boils at 100 degrees Celsius", "checkable": true}]'}}]
    }
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client:
        mock_client.return_value.__aenter__.return_value.post = AsyncMock(return_value=mock_resp)
        claims = await extractor.extract("Water boils at 100 degrees Celsius at sea level.")

    verifier = Verifier()   # Not loaded — returns neutral 50
    verifications = await verifier.verify(claims)
    score, flagged = calculate_risk_score(verifications)

    assert 40 <= score <= 60   # Neutral range
