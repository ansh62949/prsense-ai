import logging
from typing import Optional
from services.rag_service import rag_service

logger = logging.getLogger("EngineeringMemory")

class EngineeringMemory:
    def __init__(self):
        pass

    def fetch_memory_context(
        self,
        repo_name: Optional[str] = None,
        organization_id: Optional[str] = None
    ) -> str:
        """
        Queries the database for accepted learned patterns and accepted style corrections,
        and constructs a context block to guide the AI reviewer agent.
        """
        if not rag_service.enabled or not rag_service.conn:
            return ""

        context_lines = []

        # 1. Fetch learned patterns that are active
        try:
            with rag_service.conn.cursor() as cur:
                sql = """
                    SELECT title, description, confidence_score 
                    FROM learned_patterns 
                    WHERE active = true
                """
                params = []
                if organization_id:
                    sql += " AND (organization_id = %s OR organization_id IS NULL)"
                    params.append(organization_id)
                
                sql += " ORDER BY confidence_score DESC LIMIT 10"
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()

                if rows:
                    context_lines.append("### Established Team Style Conventions (Learned Patterns):")
                    for row in rows:
                        context_lines.append(f"- {row[0]}: {row[1]} (Confidence: {row[2]})")
                    context_lines.append("")
        except Exception as e:
            logger.warning(f"Could not fetch learned patterns for engineering memory: {e}")

        # 2. Fetch recently accepted review findings
        try:
            with rag_service.conn.cursor() as cur:
                sql = """
                    SELECT rf.category, rf.file_path, rf.recommendation, rf.description
                    FROM review_findings rf
                    WHERE rf.status = 'ACCEPTED'
                """
                params = []
                if organization_id:
                    sql = """
                        SELECT rf.category, rf.file_path, rf.recommendation, rf.description
                        FROM review_findings rf
                        JOIN reviews r ON rf.review_id = r.id
                        WHERE rf.status = 'ACCEPTED' AND r.organization_id = %s
                    """
                    params.append(organization_id)

                sql += " ORDER BY rf.id DESC LIMIT 10"
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()

                if rows:
                    context_lines.append("### Recently Accepted Review Recommendations:")
                    for row in rows:
                        desc = row[3] or ""
                        if len(desc) > 100:
                            desc = desc[:97] + "..."
                        context_lines.append(f"- [Category: {row[0]}] In file '{row[1]}': {row[2]} (Context: {desc})")
                    context_lines.append("")
        except Exception as e:
            logger.warning(f"Could not fetch accepted review findings for engineering memory: {e}")

        if not context_lines:
            return ""

        return "\n".join(context_lines)

engineering_memory = EngineeringMemory()
