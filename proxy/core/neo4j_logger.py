"""
Neo4j logger (optional).
Logs every firewall result as a knowledge graph:
  (Response)-[:CONTAINS]->(Claim)-[:VERIFIED_BY]->(Source)
  (Response)-[:HAS_RISK_SCORE]->(RiskScore)

Set NEO4J_ENABLED=true in .env to activate.
"""
import os
import logging
from proxy.models import FirewallResult

logger = logging.getLogger(__name__)

NEO4J_ENABLED = os.getenv("NEO4J_ENABLED", "false").lower() == "true"
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")


class Neo4jLogger:
    def __init__(self):
        self.driver = None
        if NEO4J_ENABLED:
            try:
                from neo4j import GraphDatabase
                self.driver = GraphDatabase.driver(
                    NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD)
                )
                logger.info("Neo4j logger connected.")
            except Exception as e:
                logger.warning(f"Neo4j unavailable: {e}. Continuing without graph logging.")

    def log(self, result: FirewallResult, prompt: str):
        if not self.driver:
            return
        try:
            with self.driver.session() as session:
                session.execute_write(self._write_result, result, prompt)
        except Exception as e:
            logger.warning(f"Neo4j write failed: {e}")

    @staticmethod
    def _write_result(tx, result: FirewallResult, prompt: str):
        # Create Response node
        tx.run("""
            MERGE (r:Response {request_id: $req_id})
            SET r.risk_score = $risk_score,
                r.action = $action,
                r.model = $model,
                r.rewritten = $rewritten,
                r.timestamp = datetime()
        """, req_id=result.request_id, risk_score=result.risk_score,
             action=result.action_taken.value, model=result.model,
             rewritten=result.rewritten)

        # Create Claim nodes and link them
        for claim in result.flagged_claims:
            tx.run("""
                MERGE (c:Claim {text: $text})
                SET c.risk_score = $risk_score, c.reason = $reason
                WITH c
                MATCH (r:Response {request_id: $req_id})
                MERGE (r)-[:CONTAINS]->(c)
            """, text=claim.text, risk_score=claim.risk_score,
                 reason=claim.reason, req_id=result.request_id)

    def close(self):
        if self.driver:
            self.driver.close()
