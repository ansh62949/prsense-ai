import os
import logging
import json
import hashlib
from typing import Dict, Any, List, Optional
from services.embedding_service import embedding_service

# Redis imports removed

try:
    import psycopg2
    from pgvector.psycopg2 import register_vector
except ImportError:
    psycopg2 = None
    register_vector = None

logger = logging.getLogger("PRSenseRAGService")

class DocumentLoader:
    @staticmethod
    def load_openapi(spec_json: str) -> str:
        try:
            import json
            spec = json.loads(spec_json)
        except Exception:
            return f"Raw Spec Content:\n{spec_json}"
            
        info = spec.get("info", {})
        md = [f"# API Schema: {info.get('title', 'API Spec')}\nDescription: {info.get('description', 'None')}\n"]
        
        paths = spec.get("paths", {})
        for path, methods in paths.items():
            for method, op in methods.items():
                md.append(f"## {method.upper()} {path}")
                md.append(f"Summary: {op.get('summary', 'No summary')}")
                md.append(f"OperationId: {op.get('operationId', 'None')}")
                
                params = op.get("parameters", [])
                if params:
                    md.append("Parameters:")
                    for p in params:
                        md.append(f"- {p.get('name')} ({p.get('in')}): {p.get('description', 'No desc')} (Required: {p.get('required', False)})")
                
                responses = op.get("responses", {})
                md.append("Responses:")
                for code, resp in responses.items():
                    md.append(f"- {code}: {resp.get('description', 'No desc')}")
                md.append("---")
        return "\n".join(md)


class RecursiveChunker:
    def __init__(self, chunk_size: int = 1500, chunk_overlap: int = 250):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, text: str) -> List[str]:
        if len(text) <= self.chunk_size:
            return [text]
            
        lines = text.split("\n")
        chunks = []
        current_chunk = []
        current_len = 0
        
        for line in lines:
            line_len = len(line) + 1
            if current_len + line_len > self.chunk_size and current_chunk:
                chunks.append("\n".join(current_chunk))
                overlap_lines = []
                overlap_len = 0
                for prev in reversed(current_chunk):
                    if overlap_len + len(prev) + 1 < self.chunk_overlap:
                        overlap_lines.insert(0, prev)
                        overlap_len += len(prev) + 1
                    else:
                        break
                current_chunk = overlap_lines
                current_len = overlap_len
                
            current_chunk.append(line)
            current_len += line_len
            
        if current_chunk:
            chunks.append("\n".join(current_chunk))
            
        return [c for c in chunks if c.strip()]


class RAGService:
    def __init__(self):
        self.enabled = False
        self.conn = None
        self.redis_client = None

        if psycopg2 is None or register_vector is None:
            logger.warning("psycopg2 or pgvector not available, pgvector store disabled.")
            return

        conn = self._get_conn()
        if conn is not None:
            try:
                # Setup extension, table and index
                with conn.cursor() as cur:
                    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                    
                    # Check if table style_guidelines exists to verify dimensions match
                    cur.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'style_guidelines');")
                    if cur.fetchone()[0]:
                        cur.execute("""
                            SELECT atttypmod FROM pg_attribute 
                            WHERE attrelid = 'style_guidelines'::regclass AND attname = 'embedding';
                        """)
                        row = cur.fetchone()
                        if row and row[0] != 1536:
                            logger.info("Detected old 3072 dimension column. Dropping tables for schema upgrade...")
                            cur.execute("DROP TABLE IF EXISTS style_guidelines CASCADE;")
                            cur.execute("DROP TABLE IF EXISTS memory_documents CASCADE;")

                    # Style Guidelines Table with Multi-Tenant & Commit Versioning Schema Upgrades
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS style_guidelines (
                            id SERIAL PRIMARY KEY,
                            guideline_text TEXT NOT NULL,
                            source_file VARCHAR(255),
                            embedding vector(1536)
                        );
                    """)
                    cur.execute("ALTER TABLE style_guidelines ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50);")
                    cur.execute("ALTER TABLE style_guidelines ADD COLUMN IF NOT EXISTS commit_sha VARCHAR(100);")
                    
                    try:
                        cur.execute("""
                            CREATE INDEX IF NOT EXISTS style_guidelines_embedding_idx 
                            ON style_guidelines USING hnsw (embedding vector_cosine_ops);
                        """)
                    except Exception as idx_exc:
                        logger.warning(f"Could not create HNSW index for style_guidelines: {idx_exc}")

                    # Memory Documents Table with Multi-Tenant & Commit Versioning Schema Upgrades
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS memory_documents (
                            id SERIAL PRIMARY KEY,
                            title VARCHAR(255) NOT NULL,
                            content TEXT NOT NULL,
                            content_type VARCHAR(50) NOT NULL,
                            repo_name VARCHAR(100),
                            embedding vector(1536),
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                    cur.execute("ALTER TABLE memory_documents ADD COLUMN IF NOT EXISTS organization_id VARCHAR(50);")
                    cur.execute("ALTER TABLE memory_documents ADD COLUMN IF NOT EXISTS commit_sha VARCHAR(100);")
                    
                    try:
                        cur.execute("""
                            CREATE INDEX IF NOT EXISTS memory_documents_embedding_idx 
                            ON memory_documents USING hnsw (embedding vector_cosine_ops);
                        """)
                    except Exception as idx_exc:
                        logger.warning(f"Could not create HNSW index for memory_documents: {idx_exc}")
                        
                    # Repository Summaries Cache Table
                    cur.execute("""
                        CREATE TABLE IF NOT EXISTS repository_summaries (
                            id SERIAL PRIMARY KEY,
                            repo_name VARCHAR(100) UNIQUE NOT NULL,
                            summary TEXT,
                            technology_stack TEXT,
                            architecture_patterns TEXT,
                            coding_conventions TEXT,
                            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );
                    """)
                
                logger.info("RAGService successfully initialized tables and verified connection to PostgreSQL")
            except Exception as exc:
                logger.warning(f"Unable to run schema queries during initialization: {exc}")

    def _get_conn(self):
        if psycopg2 is None:
            return None
            
        # Try to use existing connection
        if self.conn:
            try:
                with self.conn.cursor() as cur:
                    cur.execute("SELECT 1;")
                return self.conn
            except Exception:
                logger.warning("Existing database connection is dead. Reconnecting...")
                try:
                    self.conn.close()
                except Exception:
                    pass
                self.conn = None
                
        # Re-establish connection
        db_url = os.getenv("DATABASE_URL") or os.getenv("SPRING_DATASOURCE_URL")
        
        # Check for obvious placeholder characters or brackets in the connection string
        if db_url:
            if any(char in db_url for char in ['[', ']', '<', '>', '{', '}']):
                logger.warning("WARNING: DATABASE_URL contains bracket/placeholder characters ('[', ']', '<', '>', '{', '}'). "
                               "Please ensure you have replaced placeholders with your actual password and removed the brackets themselves.")
                               
        try:
            if db_url:
                if db_url.startswith("jdbc:"):
                    db_url = db_url[5:]
                self.conn = psycopg2.connect(db_url)
            else:
                host = os.getenv("POSTGRES_HOST", "127.0.0.1")
                port = os.getenv("POSTGRES_PORT", "5432")
                dbname = os.getenv("POSTGRES_DB")
                user = os.getenv("POSTGRES_USER")
                password = os.getenv("POSTGRES_PASSWORD")
                if not all([host, dbname, user, password]):
                    logger.warning("Database parameters missing; cannot reconnect.")
                    return None
                self.conn = psycopg2.connect(
                    host=host,
                    port=port,
                    dbname=dbname,
                    user=user,
                    password=password,
                )
            
            self.conn.autocommit = True
            
            # Pre-register vector: create extension first if not present
            try:
                with self.conn.cursor() as cur:
                    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            except Exception as ext_err:
                logger.warning(f"Could not check/create vector extension: {ext_err}")
                
            register_vector(self.conn)
            self.enabled = True
            return self.conn
        except Exception as exc:
            logger.warning(f"Failed to reconnect to PostgreSQL: {exc}")
            self.conn = None
            return None

    def fetch_style_guidelines(
        self,
        query: str,
        limit: int = 3,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> str:
        conn = self._get_conn()
        if conn is None:
            return ""
        embedding = embedding_service.embed_text(query)
        if not embedding:
            return ""

        try:
            with conn.cursor() as cur:
                sql = "SELECT guideline_text, source_file FROM style_guidelines WHERE 1=1"
                params = []
                if organization_id:
                    sql += " AND (organization_id = %s OR organization_id IS NULL)"
                    params.append(organization_id)
                if commit_sha:
                    sql += " AND (commit_sha = %s OR commit_sha IS NULL)"
                    params.append(commit_sha)
                
                sql += " ORDER BY embedding <-> %s::vector LIMIT %s"
                params.extend([embedding, limit])
                
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()
            return "\n\n".join(f"- {row[0]} (source: {row[1]})" for row in rows if row)
        except Exception as exc:
            logger.warning(f"pgvector query failed: {exc}")
            return ""

    def insert_style_guideline(
        self,
        guideline_text: str,
        source_file: str,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> bool:
        conn = self._get_conn()
        if conn is None:
            logger.warning("pgvector store is not enabled; cannot insert guideline.")
            return False
        embedding = embedding_service.embed_text(guideline_text)
        if not embedding:
            logger.warning("Failed to generate embedding for guideline.")
            return False

        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO style_guidelines (guideline_text, source_file, embedding, organization_id, commit_sha) VALUES (%s, %s, %s::vector, %s, %s)",
                    (guideline_text, source_file, embedding, organization_id, commit_sha),
                )
            logger.info("Successfully inserted style guideline to vector database.")
            return True
        except Exception as exc:
            logger.warning(f"pgvector insert failed: {exc}")
            return False

    def insert_memory_document(
        self,
        title: str,
        content: str,
        content_type: str,
        repo_name: Optional[str] = None,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> int:
        conn = self._get_conn()
        if conn is None:
            logger.warning("pgvector store is not enabled; cannot insert memory document.")
            return 0
            
        raw_content = content
        if content_type == "api_doc" and "openapi" in content.lower():
            raw_content = DocumentLoader.load_openapi(content)
            
        chunker = RecursiveChunker()
        chunks = chunker.chunk_document(raw_content)
        
        # Batch generate embeddings for all chunks of the document
        embeddings = embedding_service.embed_texts(chunks)
        
        saved_count = 0
        for i, chunk in enumerate(chunks):
            title_tag = f"{title} (Part {i+1})" if len(chunks) > 1 else title
            embedding = embeddings[i] if i < len(embeddings) else None
            if not embedding:
                logger.warning(f"Failed to generate embedding for chunk {i}.")
                continue
                
            try:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO memory_documents (title, content, content_type, repo_name, embedding, organization_id, commit_sha) VALUES (%s, %s, %s, %s, %s::vector, %s, %s)",
                        (title_tag, chunk, content_type, repo_name, embedding, organization_id, commit_sha),
                    )
                saved_count += 1
            except Exception as exc:
                logger.warning(f"Failed to write chunk {i} to pgvector database: {exc}")
                
        return saved_count

    def delete_memory_documents(self, repo_name: str) -> bool:
        conn = self._get_conn()
        if conn is None:
            logger.warning("pgvector store is not enabled; cannot delete memory documents.")
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM memory_documents WHERE repo_name = %s",
                    (repo_name,)
                )
            logger.info(f"Deleted existing memory documents for repository: {repo_name}")
            return True
        except Exception as exc:
            logger.error(f"Failed to delete memory documents for {repo_name}: {exc}")
            return False

    def fetch_relevant_context(
        self,
        query: str,
        repo_name: Optional[str] = None,
        content_type: Optional[str] = None,
        limit: int = 5,
        organization_id: Optional[str] = None,
        commit_sha: Optional[str] = None
    ) -> Dict[str, Any]:
        from datetime import datetime
        logger.info(f"[Vector Search] Starting similarity search for query: '{query[:60]}...' (repo: {repo_name}, content_type: {content_type})")
        
        conn = self._get_conn()
        if conn is None:
            logger.warning("[Vector Search] pgvector store not connected; returning empty context.")
            return {"context_block": "Vector database not connected.", "documents": []}
            
        # Redis cache check removed

        embedding = embedding_service.embed_text(query)
        if not embedding:
            logger.warning("[Vector Search] Failed to generate query embedding; returning empty context.")
            return {"context_block": "Failed to generate search embedding.", "documents": []}
            
        logger.info(f"[Vector Search] Successfully generated query embedding of size {len(embedding)}")
            
        try:
            with conn.cursor() as cur:
                sql = """
                    SELECT id, title, content, content_type, repo_name, 1 - (embedding <=> %s::vector) AS similarity, created_at
                    FROM memory_documents
                    WHERE 1=1
                """
                params = [embedding]
                
                if repo_name:
                    sql += " AND (repo_name = %s OR repo_name IS NULL)"
                    params.append(repo_name)
                if content_type:
                    sql += " AND content_type = %s"
                    params.append(content_type)
                if organization_id:
                    sql += " AND (organization_id = %s OR organization_id IS NULL)"
                    params.append(organization_id)
                    
                sql += " AND (embedding <=> %s::vector) <= 0.35"
                params.append(embedding)
                
                sql += " ORDER BY embedding <=> %s::vector LIMIT %s"
                params.extend([embedding, limit])
                
                # Replace newlines for compact logs
                sql_log = sql.replace('\n', ' ').replace('  ', ' ').strip()
                logger.info(f"[Vector Search] Executing SQL: {sql_log}")
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()
                
            logger.info(f"[Vector Search] Query returned {len(rows)} matching chunks.")
            
            documents = []
            context_blocks = []
            for row in rows:
                if not row:
                    continue
                doc = {
                    "id": row[0],
                    "title": row[1],
                    "content": row[2],
                    "content_type": row[3],
                    "repo_name": row[4],
                    "score": round(float(row[5]), 4) if row[5] is not None else 0.75,
                    "created_at": row[6].isoformat() if row[6] else datetime.utcnow().isoformat()
                }
                logger.info(f" - [Chunk Found] ID: {doc['id']}, Title: {doc['title']}, Score: {doc['score']}")
                documents.append(doc)
                
                header = f"\n[SOURCE: {doc['content_type'].upper()} | TITLE: {doc['title']} | RELEVANCE SCORE: {doc['score']:.2f}]\n"
                context_blocks.append(header + doc['content'].strip() + "\n---\n")
                
            if not rows:
                logger.warning(f"[Vector Search] No chunks matched the cosine distance threshold (<= 0.35) for repo {repo_name}")
                
            context_block = "".join(context_blocks) if context_blocks else "No relevant repository context retrieved."
            
            res = {
                "context_block": context_block,
                "documents": documents
            }
            # Redis cache set removed
            return res
        except Exception as exc:
            logger.error(f"[Vector Search] pgvector semantic query search failed: {exc}", exc_info=True)
            return {"context_block": f"RAG query execution error: {exc}", "documents": []}

    def get_memory_stats(self, repo_name: Optional[str] = None) -> Dict[str, Any]:
        stats = {"total_documents": 0, "document_counts": {}}
        conn = self._get_conn()
        if conn is None:
            return stats
        try:
            with conn.cursor() as cur:
                sql = "SELECT content_type, COUNT(id) FROM memory_documents"
                params = []
                if repo_name:
                    sql += " WHERE repo_name = %s"
                    params.append(repo_name)
                sql += " GROUP BY content_type;"
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()
                total = 0
                for row in rows:
                    if row:
                        ct = row[0]
                        count = int(row[1])
                        stats["document_counts"][ct] = count
                        total += count
                stats["total_documents"] = total
            return stats
        except Exception as exc:
            logger.warning(f"Failed to fetch RAG stats: {exc}")
            return stats

    def insert_learned_preference(self, title: str, content: str, repo_name: Optional[str], category: str, description: str, confidence: float) -> bool:
        conn = self._get_conn()
        if conn is None:
            return False
        embedding = embedding_service.embed_text(description)
        if not embedding:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO memory_documents (title, content, content_type, repo_name, embedding) VALUES (%s, %s, %s, %s, %s::vector)",
                    (title, content, "learned_preference", repo_name, embedding),
                )
            logger.info(f"Learned preference '{title}' saved to database.")
            return True
        except Exception as exc:
            logger.warning(f"Failed to save learned preference: {exc}")
            return False

    def fetch_learned_patterns(self, repo_name: Optional[str] = None) -> List[dict]:
        patterns = []
        conn = self._get_conn()
        if conn is None:
            return patterns
        try:
            with conn.cursor() as cur:
                sql = "SELECT id, title, content, repo_name, created_at FROM memory_documents WHERE content_type = 'learned_preference'"
                params = []
                if repo_name:
                    sql += " AND repo_name = %s"
                    params.append(repo_name)
                sql += " ORDER BY id DESC"
                cur.execute(sql, tuple(params))
                rows = cur.fetchall()
                
            for row in rows:
                if not row:
                    continue
                content = row[2]
                
                category = "style"
                confidence = 0.85
                description = content
                
                lines = content.split("\n")
                for line in lines:
                    if line.startswith("Pattern Category: "):
                        category = line.replace("Pattern Category: ", "").strip()
                    elif line.startswith("Confidence: "):
                        try:
                            confidence = float(line.replace("Confidence: ", "").strip())
                        except Exception:
                            pass
                    elif line.startswith("Description: "):
                        description = line.replace("Description: ", "").strip()
                        
                patterns.append({
                    "id": row[0],
                    "title": row[1],
                    "description": description,
                    "category": category,
                    "confidence": confidence,
                    "repo_name": row[3],
                    "created_at": row[4].isoformat() if row[4] else ""
                })
            return patterns
        except Exception as exc:
            logger.warning(f"Failed to fetch learned patterns: {exc}")
            return patterns

    def fetch_cached_summary(self, repo_name: str, ignore_age: bool = False) -> Optional[Dict[str, Any]]:
        conn = self._get_conn()
        if conn is None:
            return None
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT summary, technology_stack, architecture_patterns, coding_conventions, generated_at "
                    "FROM repository_summaries WHERE repo_name = %s",
                    (repo_name,)
                )
                row = cur.fetchone()
                if row:
                    from datetime import datetime, timedelta
                    import json
                    
                    def safe_parse_list(val):
                        if not val:
                            return []
                        if isinstance(val, list):
                            return val
                        try:
                            parsed = json.loads(val)
                            if isinstance(parsed, list):
                                return [str(item) for item in parsed]
                        except Exception:
                            pass
                        cleaned = val.strip("[]'\" ")
                        if not cleaned:
                            return []
                        return [item.strip("'\" ") for item in cleaned.split(",")]

                    generated_at = row[4]
                    # Check age < 24 hours
                    if ignore_age or (datetime.utcnow() - generated_at < timedelta(hours=24)):
                        return {
                            "summary": row[0],
                            "technology_stack": safe_parse_list(row[1]),
                            "architecture_patterns": safe_parse_list(row[2]),
                            "coding_conventions": safe_parse_list(row[3])
                        }
                    else:
                        logger.info(f"Cached summary for {repo_name} is expired (> 24h)")
        except Exception as e:
            logger.warning(f"Failed to fetch cached summary: {e}")
        return None

    def save_cached_summary(self, repo_name: str, data: Dict[str, Any]):
        conn = self._get_conn()
        if conn is None:
            return
        try:
            import json
            
            def safe_serialize_list(val):
                if isinstance(val, list):
                    return json.dumps(val)
                return str(val) if val is not None else "[]"

            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO repository_summaries (repo_name, summary, technology_stack, architecture_patterns, coding_conventions, generated_at) "
                    "VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP) "
                    "ON CONFLICT (repo_name) DO UPDATE SET "
                    "summary = EXCLUDED.summary, "
                    "technology_stack = EXCLUDED.technology_stack, "
                    "architecture_patterns = EXCLUDED.architecture_patterns, "
                    "coding_conventions = EXCLUDED.coding_conventions, "
                    "generated_at = CURRENT_TIMESTAMP",
                    (
                        repo_name,
                        data.get("summary"),
                        safe_serialize_list(data.get("technology_stack")),
                        safe_serialize_list(data.get("architecture_patterns")),
                        safe_serialize_list(data.get("coding_conventions"))
                    )
                )
                conn.commit()
            logger.info(f"Successfully saved summary to cache for repo {repo_name}")
        except Exception as e:
            logger.warning(f"Failed to save cached summary: {e}")
            try:
                conn.rollback()
            except Exception:
                pass

rag_service = RAGService()
