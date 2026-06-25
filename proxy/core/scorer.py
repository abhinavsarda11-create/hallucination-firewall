"""
Scorer.
Aggregates per-claim verification scores into a single response-level
hallucination risk score (0 = safe, 100 = very likely hallucinated).
Also tags individual claims with their risk level.
"""
from proxy.models import FlaggedClaim
from proxy.core.verifier import VerificationResult

# Thresholds for flagging individual claims
CLAIM_HIGH_RISK_THRESHOLD = 35      # Verification score below this = flagged
CLAIM_MEDIUM_RISK_THRESHOLD = 55


def calculate_risk_score(verifications: list[VerificationResult]) -> tuple[float, list[FlaggedClaim]]:
    """
    Returns:
        risk_score: float 0–100 (response-level)
        flagged_claims: list of FlaggedClaim with per-claim detail
    """
    if not verifications:
        return 0.0, []

    flagged: list[FlaggedClaim] = []
    claim_risks = []

    for v in verifications:
        # Invert: low verification score → high risk
        claim_risk = 100 - v.score
        claim_risks.append(claim_risk)

        if claim_risk >= CLAIM_HIGH_RISK_THRESHOLD:
            flagged.append(FlaggedClaim(
                text=v.claim,
                risk_score=round(claim_risk, 1),
                reason=_reason(v),
                suggested_correction=None,  # Filled by action.py if REWRITE
            ))

    # Response-level score: weighted toward worst-case claims
    # 70% max claim risk + 30% mean — penalises any single bad claim
    max_risk = max(claim_risks)
    mean_risk = sum(claim_risks) / len(claim_risks)
    response_risk = round(0.7 * max_risk + 0.3 * mean_risk, 1)

    return response_risk, flagged


def _reason(v: VerificationResult) -> str:
    score = v.score
    if score < 20:
        return "No supporting evidence found in knowledge base"
    elif score < 40:
        return f"Weak evidence (best match similarity: {score:.0f}%)"
    else:
        return f"Partial evidence found (similarity: {score:.0f}%)"
