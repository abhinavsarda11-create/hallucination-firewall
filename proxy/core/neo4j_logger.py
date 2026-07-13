"""
Neo4j Knowledge Graph Logger.
Stores every intercepted response and its flagged claims as a graph.

Graph schema:
  (Response)-[:HAS_CLAIM]->(Claim)
  (Response)-[:TOOK_ACTION]->(Action)

Allows you to query:
  - Which claims are hallucinated most often?
  - Which topics trigger the most warnings?
  - What's the average risk score over time?
"""
import os
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class Neo4jLogger:
    def __init__(self):
        self._driver = None
        self._enabled = os.getenv("NEO4J_ENABLED", "false").lower() == "true"

    def _get_driver(self):
        """Lazily initialise the driver so startup doesn't fail if Neo4j is down."""
        if self._driver is not None:
            return self._driver
        if not self._enabled:
            return None
        try:
            from neo4j import GraphDatabase
            uri  = os.getenv("NEO4J_URI", "")
            user = os.getenv("NEO4J_USER", "neo4j")
            pwd  = os.getenv("NEO4J_PASSWORD", "")
            if not uri or not pwd:
                logger.warning("Neo4j: NEO4J_URI or NEO4J_PASSWORD not set — logging disabled.")
                self._enabled = False
                return None
            self._driver = GraphDatabase.driver(uri, auth=(user, pwd))
            # Verify connectivity
            self._driver.verify_connectivity()
            logger.info(f"Neo4j connected: {uri}")
            self._create_indexes()
            return self._driver
        except ImportError:
            logger.warning("Neo4j: neo4j package not installed. Run: pip install neo4j")
            self._enabled = False
            return None
        except Exception as e:
            logger.error(f"Neo4j connection failed: {e}")
            self._enabled = False
            return None

    def _create_indexes(self):
        """Create indexes for faster queries."""
        driver = self._driver
        if not driver:
            return
        try:
            with driver.session() as session:
                session.run("CREATE INDEX response_id IF NOT EXISTS FOR (r:Response) ON (r.request_id)")
                session.run("CREATE INDEX claim_text IF NOT EXISTS FOR (c:Claim) ON (c.text)")
                session.run("CREATE INDEX action_name IF NOT EXISTS FOR (a:Action) ON (a.name)")
            logger.info("Neo4j indexes created.")
        except Exception as e:
            logger.warning(f"Neo4j index creation: {e}")

    def log(self, result, prompt: str = ""):
        """Log a FirewallResult to the Neo4j graph."""
        if not self._enabled:
            return
        driver = self._get_driver()
        if not driver:
            return
        try:
            with driver.session() as session:
                session.execute_write(self._write_result, result, prompt)
            logger.debug(f"Neo4j: logged request {result.request_id}")
        except Exception as e:
            logger.error(f"Neo4j log failed: {e}")

    @staticmethod
    def _write_result(tx, result, prompt: str):
        now = datetime.now(timezone.utc).isoformat()

        # Create Response node
        tx.run("""
            MERGE (r:Response {request_id: $request_id})
            SET r.risk_score     = $risk_score,
                r.action_taken   = $action_taken,
                r.rewritten      = $rewritten,
                r.model          = $model,
                r.latency_ms     = $latency_ms,
                r.prompt         = $prompt,
                r.original_answer= $original_answer,
                r.final_answer   = $final_answer,
                r.timestamp      = $timestamp,
                r.prompt_tokens  = $prompt_tokens,
                r.completion_tokens = $completion_tokens
        """, {
            "request_id":       result.request_id,
            "risk_score":       result.risk_score,
            "action_taken":     result.action_taken.value if hasattr(result.action_taken, "value") else str(result.action_taken),
            "rewritten":        result.rewritten,
            "model":            result.model,
            "latency_ms":       result.latency_ms,
            "prompt":           prompt[:500] if prompt else "",
            "original_answer":  result.original_answer[:1000] if result.original_answer else "",
            "final_answer":     result.final_answer[:1000] if result.final_answer else "",
            "timestamp":        now,
            "prompt_tokens":    result.prompt_tokens,
            "completion_tokens":result.completion_tokens,
        })

        # Create Action node and relationship
        action_str = result.action_taken.value if hasattr(result.action_taken, "value") else str(result.action_taken)
        tx.run("""
            MERGE (a:Action {name: $action})
            WITH a
            MATCH (r:Response {request_id: $request_id})
            MERGE (r)-[:TOOK_ACTION]->(a)
        """, {"action": action_str, "request_id": result.request_id})

        # Create Claim nodes and relationships
        for claim in result.flagged_claims:
            claim_text = claim.text[:500] if hasattr(claim, "text") else str(claim)[:500]
            claim_reason = claim.reason if hasattr(claim, "reason") else ""
            claim_score = claim.risk_score if hasattr(claim, "risk_score") else 0

            tx.run("""
                MERGE (c:Claim {text: $text})
                SET c.last_seen   = $timestamp,
                    c.occurrences = COALESCE(c.occurrences, 0) + 1
                WITH c
                MATCH (r:Response {request_id: $request_id})
                MERGE (r)-[rel:HAS_CLAIM]->(c)
                SET rel.risk_score = $risk_score,
                    rel.reason     = $reason,
                    rel.timestamp  = $timestamp
            """, {
                "text":       claim_text,
                "timestamp":  now,
                "request_id": result.request_id,
                "risk_score": float(claim_score),
                "reason":     claim_reason[:500] if claim_reason else "",
            })

    def get_stats(self) -> dict:
        """Return graph statistics — used by the health endpoint."""
        driver = self._get_driver()
        if not driver:
            return {"enabled": False}
        try:
            with driver.session() as session:
                result = session.run("""
                    MATCH (r:Response)
                    OPTIONAL MATCH (r)-[:HAS_CLAIM]->(c:Claim)
                    RETURN
                        count(DISTINCT r) AS total_responses,
                        count(DISTINCT c) AS unique_claims,
                        avg(r.risk_score) AS avg_risk_score,
                        max(r.risk_score) AS max_risk_score
                """)
                row = result.single()
                return {
                    "enabled":         True,
                    "total_responses": row["total_responses"],
                    "unique_claims":   row["unique_claims"],
                    "avg_risk_score":  round(row["avg_risk_score"] or 0, 1),
                    "max_risk_score":  round(row["max_risk_score"] or 0, 1),
                }
        except Exception as e:
            logger.error(f"Neo4j stats error: {e}")
            return {"enabled": True, "error": str(e)}

    def get_top_hallucinated_claims(self, limit: int = 10) -> list:
        """Return the most frequently hallucinated claims."""
        driver = self._get_driver()
        if not driver:
            return []
        try:
            with driver.session() as session:
                result = session.run("""
                    MATCH (c:Claim)
                    RETURN c.text AS claim, c.occurrences AS count
                    ORDER BY c.occurrences DESC
                    LIMIT $limit
                """, {"limit": limit})
                return [{"claim": r["claim"], "count": r["count"]} for r in result]
        except Exception as e:
            logger.error(f"Neo4j top claims error: {e}")
            return []

    def close(self):
        if self._driver:
            self._driver.close()
            self._driver = None
