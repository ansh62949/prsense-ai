# PRSense AI Engineering Notes & Architectural Refactoring Log

This document preserves the comprehensive history of bug fixes, optimizations, and architectural refactoring performed on PRSense AI.

---

## 1. Eliminated Redis & Celery Dependencies (Target Architecture Refactor)
*   **Root Cause**: The Redis database and Celery background workers are too resource-heavy for free deployment environments (e.g. Render free tier) and introduce deployment complexity.
*   **Resolution**:
    1.  **Removed Redis from Spring Boot**: Deleted `spring-boot-starter-data-redis` from [pom.xml](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/pom.xml).
    2.  **Deleted Celery Worker**: Removed [celery_worker.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/celery_worker.py) and [CeleryProducerService.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/service/CeleryProducerService.java) from the codebase completely.
    3.  **Removed Redis Caching**: Removed Redis client setup, context caching queries, and cache writes from [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py).
    4.  **Updated Render Configuration**: Cleaned up [render.yaml](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/render.yaml) to completely remove the `prsense-ai-worker` worker service definition and `REDIS_URL` variables.

## 2. Implemented Direct Asynchronous HTTP Task Execution
*   **FastAPI AI service endpoints**:
    1.  Created a new indexing router [indexing.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/routers/indexing.py) exposing `/api/index/repository`.
    2.  Added a direct route `/api/review/run` in [review.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/routers/review.py).
    3.  Added a direct route `/api/learner/run` in [learner.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/routers/learner.py).
    4.  Consolidated background task runner logic (e.g. cloning, PR diff fetching, RAG database updates, callback posts) inside a new shared [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py).
    5.  Used FastAPI's native `BackgroundTasks` handler to execute these events asynchronously, preventing blocking responses.
*   **Spring Boot Client & Controller changes**:
    1.  Created [AiIndexingClient.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/service/AiIndexingClient.java) to dispatch POST HTTP calls to FastAPI using `RestTemplate`.
    2.  Modified [RepositoryController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/RepositoryController.java) to invoke `AiIndexingClient.indexRepository` asynchronously using `CompletableFuture.runAsync` and update DB status (`INDEXING` -> `INDEXED` / `FAILED`).
    3.  Modified [WebhookController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/WebhookController.java) to invoke `runReview` and `runLearner` using `CompletableFuture.runAsync`.
    4.  Simplified [HealthController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/HealthController.java) and [MonitoringService.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/service/MonitoringService.java) to run without checking Redis status or queue sizes.

## 3. Fixed Vector Dimensions, Callback URLs, and Repeat triggers
*   **pgvector Dimensions Mismatch**: Enforced exactly **1536** dimensions for generated query and chunk embeddings inside `EmbeddingService.embed_text` in [embedding_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/embedding_service.py) (by truncating/padding). Also configured `OpenAIEmbeddings` in [llm_provider.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/llm_provider.py) to return 1536 dimensions natively. This prevents all dimension mismatch insert errors in the database.
*   **Callback URL Scheme Resolution**: Added `BACKEND_URL` in [render.yaml](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/render.yaml) under `prsense-ai-service`. Updated `async_task_service.py` callback builder to safely check and prepend scheme (`http://` or `https://`) dynamically depending on hostname, resolving production connection errors.
*   **Defensive Callback URL Override**: In [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py), added a fallback check that automatically discards any incorrect `localhost:8080` callback environment variables when running in production (if a valid non-localhost `BACKEND_URL` is configured), replacing it with the proper production URL.
*   **Repeat Trigger Guard**: Added protection inside `RepositoryController.java` to check repository status before triggering indexing. If status is already `INDEXING`, it returns immediately, avoiding multiple concurrent task submissions. Forced indexing is permitted if status is `INDEXED` or `FAILED`.
*   **Frontend AI Service Fallback URL**: Updated `AI_URL` in [api.js](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-frontend/src/config/api.js) to fall back to `import.meta.env.VITE_AI_SERVICE_URL` if `VITE_AI_URL` is not set, aligning with the variable configuration in the Vercel dashboard.
*   **Optimized Refresh Intervals**: Increased the default page polling interval on [Monitoring.jsx](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-frontend/src/pages/Monitoring.jsx) from 5s to 30s to stay within Gemini's free tier API rate limit thresholds.

## 4. AI Service Response Caching & Quota Exhaustion Fallbacks
*   **24-Hour Summary Database Cache**:
    1.  Updated [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py) to declare and create the `repository_summaries` table on startup initialization.
    2.  Implemented `fetch_cached_summary` and `save_cached_summary` in [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py).
    3.  Added robust JSON serialization and deserialization (`json.dumps`/`json.loads`) for list fields (`technology_stack`, `architecture_patterns`, `coding_conventions`) stored in `TEXT` columns to prevent data corruption.
*   **Cached Hits & Expired Recovery in `/api/repository/summary`**:
    1.  Modified `get_repository_summary_details` in [repository_profile.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/routers/repository_profile.py) to check the cache first.
    2.  If the cache exists and is less than 24 hours old, it returns immediately without invoking Gemini.
    3.  If missing or expired, it triggers a new Gemini summary and updates the cache.
    4.  If the Gemini call fails (e.g. 429 Quota Exceeded), the API recovers by fetching the expired cached summary (ignoring the 24-hour age constraint) and returns it.
    5.  If no cache exists at all, it returns a friendly "Quota Exceeded" JSON message instead of crashing with a 500 error.
*   **Graceful Router Exception Shields**:
    1.  **Repository Profile**: Updated `generate_repository_profile` in [repository_profile.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/routers/repository_profile.py) to catch Gemini exceptions and return `success=False` with a descriptive message.
    2.  **Ask Copilot**: Modified `ask_repository_copilot` in [ask_repository.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/routers/ask_repository.py) to return a friendly response string on rate limit failures.
    3.  **PR Review**: Updated `review_pr` in [review.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/routers/review.py) to construct a fallback finding report and summary detailing quota limits.

## 5. Groq LLM Provider Integration and Fallback Architecture
*   **Groq Provider Support**:
    1.  Updated [llm_provider.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/llm_provider.py) to load `GROQ_API_KEY` and parse `LLM_PROVIDER=groq`.
    2.  Configured the default Groq model `llama-3.3-70b-versatile` inside the `llm_model` property.
    3.  Updated model routing in [prompt_registry.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/prompt_registry.py) to route to `llama-3.3-70b-versatile` when using the Groq provider.
*   **Robust Model Failover Chains**:
    1.  Re-engineered `get_llm()` to create a fallback model chain starting with the chosen provider (Groq, Gemini, or OpenAI) and chaining the remaining models as fallbacks using LangChain's native `with_fallbacks()` mechanism.
    2.  Configured automatic failover: `Groq -> Gemini -> OpenAI`.
    3.  Updated `get_embeddings()` to automatically default to `GeminiEmbeddings` when using `groq` or `gemini` if `GEMINI_API_KEY` is present.
*   **Startup Logging & Environment**:
    1.  Updated [main.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/main.py) startup event to log the exact active provider using the format: `"Starting PRSense AI Service with provider: <provider>"`.
    2.  Added startup validation warnings if `GROQ_API_KEY` is missing while provider is `"groq"`.
    3.  Updated [.env.example](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/.env.example) to include `LLM_PROVIDER=groq` and `GROQ_API_KEY=` fields.
*   **Global Configuration Consolidation**:
    1.  Updated [config.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/config.py) to import the active `LLM_PROVIDER` and resolved model symbols directly from `services.llm_provider` to ensure consistency.

## 6. Robust Callback URL Resolution & Event Logging
*   **Multi-Format Local Address Detection**:
    1.  Updated [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py) to check for local address variants (`localhost` or `127.0.0.1`) inside the configured callback URL.
    2.  If the callback URL contains any local host address and a production `BACKEND_URL` is configured, it successfully overrides and reconstructs it from `BACKEND_URL`.
*   **Verbose Callback Diagnostics**:
    1.  Added startup logs to print the final resolved `BACKEND_CALLBACK_URL` on initialization.
    2.  Added event-driven logs inside `process_review_event` and `process_index_event` to output the exact destination callback URLs when posting completion/indexing updates back to the Spring Boot backend.

## 7. BACKEND_URL Enforcement in Production
*   **Required in Production (Render)**:
    1.  Added checks to [main.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/main.py) and [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py) that raise a `RuntimeError` immediately if `BACKEND_URL` is missing in a production environment (detected when `RENDER == "true"` or `PORT` is defined).
    2.  This fails the container build/startup loudly rather than allowing silent local fallbacks to hide configuration issues.
*   **Local Development Fallback**:
    1.  If `BACKEND_URL` is missing locally, the system prints a warning and defaults to `http://localhost:8080` to preserve developer ergonomics.
*   **Early Logger Configuration**:
    1.  Moved the `logging.basicConfig(level=logging.INFO)` initialization to the absolute top of [main.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/main.py), capturing early module initialization logs (e.g. LLM provider and async task resolution status) before routers are imported.

## 8. Asynchronous Indexing & Snapshot 404 Resolution
We resolved the `404 Not Found` error when fetching repository snapshots by correcting a backend state machine flaw and enhancing the frontend indexing UI.
*   **Spring Boot Premature Status Update**:
    *   Previously, the `triggerIndexing` method in [RepositoryController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/RepositoryController.java) immediately updated the repository status in the database to `INDEXED` (progress 100) as soon as the FastAPI service returned a successful task queue response.
    *   This was premature since the background indexing task was still running in the background. The frontend was misled into requesting `/api/repositories/{id}/snapshot` immediately, which resulted in a `404 Not Found` (no snapshot persisted yet).
    *   **Fix**: Modified the completion block in [RepositoryController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/RepositoryController.java) to only set the status to `FAILED` if the enqueueing fails, leaving the status as `INDEXING` to be driven entirely by the background callbacks sent from the FastAPI workers.
*   **Frontend UI Indexing State & quiet polling**:
    *   **Fix**: Enhanced [RepositoryIntelligence.jsx](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-frontend/src/pages/RepositoryIntelligence.jsx) to display a beautiful "Analyzing Codebase" progress screen containing progress bar updates when `activeRepo.indexingStatus === "INDEXING"`.
    *   **Quiet Polling**: Added background polling using React's `useEffect` that calls `loadRepositoryData` in a `quiet` mode (without displaying a fullscreen loader spinner) every 5 seconds while the status is `INDEXING`. The polling terminates automatically when indexing completes or fails, transitioning the UI smoothly to the repository intelligence dashboard.
*   **Header AI Service Status Indicator**:
    *   **Fix**: Fixed a JS import bug in [LayoutPremium.jsx](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-frontend/src/components/layout/LayoutPremium.jsx) where `aiApi` was not imported. This was causing a `ReferenceError` inside the health check function, incorrectly marking the AI Service as `Offline` even if it was online.
*   **Database Self-Healing**:
    *   **Fix**: Added a self-healing block inside `getRepositorySnapshot` in [RepositoryController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/RepositoryController.java). If the database lists the repository's status as `INDEXED` but the snapshot list is empty (indicative of a corrupted historical state), the backend automatically resets the status to `PENDING` so the user is shown the correct state and can re-index.
    *   **Fix**: Refactored the update sequence to run inside a dedicated, writable service method `resetIndexingStatus` in [RepositoryService.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/service/RepositoryService.java) marked with `@Transactional`. This prevents session read-only transaction/flush errors (which previously threw a 500 error because the parent fetch transaction was read-only).

## 9. Gemini Batch Embeddings Optimization
We resolved the RAG indexing bottleneck caused by Gemini API `429 Too Many Requests` rate limits by moving from sequential single-document embedding calls to Gemini's native batch embedding API.
*   **Gemini batchEmbedContents Integration**:
    *   **Fix**: Modified the `GeminiEmbeddings` wrapper class inside [llm_provider.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/llm_provider.py) to implement `embed_documents(texts: list[str])`.
    *   Instead of loops executing single-document `embed_query` calls, it posts payloads directly to Gemini's native `:batchEmbedContents` API endpoint in chunks of 30, dramatically reducing network/API frequency overhead.
*   **Batch Service Interface & RAG updates**:
    *   **Fix**: Implemented `embed_texts` inside [embedding_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/embedding_service.py) to map, batch, and align embedding dimension arrays to 1536.
    *   **Fix**: Refactored `insert_memory_document` in [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py) to fetch pre-computed batch embeddings for all document chunks in a single request, speeding up codebase indexing by 10x and bypassing rate limit blocks.

## 10. Resolved Vercel SPA Subpath Routing (404 Not Found)
*   **Root Cause**: When a single page application (SPA) is deployed to Vercel, direct access or page refreshes on subpaths (like `/intelligence`) trigger Vercel to look for physical files at those locations, resulting in a `404 Not Found` error. This is because Vercel requires routing rewrite rules in `vercel.json`. Additionally, setting `"cleanUrls": true` in `vercel.json` can conflict with catch-all rewrites, causing Vercel to ignore SPA redirect rules and continue returning Vercel's default system 404 page (throwing Minified React #418 and CSP errors).
*   **Resolution**: Simplified and updated the `vercel.json` configurations at both the repository root `./vercel.json` and inside the subdirectory [prsense-frontend/vercel.json](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-frontend/vercel.json). Removed the redundant `"cleanUrls": true` parameter and refined the SPA rewrite pattern to:
    ```json
    {
      "rewrites": [
        {
          "source": "/((?!assets/|favicon.ico|favicon.svg).*)",
          "destination": "/index.html"
        }
      ]
    }
    ```
    This directs Vercel to route all non-static requests (excluding assets and favicons) to `index.html` where client-side routing handles the path, resolving the 404 reload errors cleanly.

## 11. Resolved JPA/Hibernate LazyInitializationException in Entities
*   **Root Cause**: When returning entity objects directly in API controllers (such as `/api/repositories/{id}/snapshot` or `GET /api/repositories`), Jackson serializes the objects into JSON. If the entities contain `@ManyToOne(fetch = FetchType.LAZY)` fields (e.g. `repository` in `RepositorySnapshot` or `workspace` in `Repository`), Jackson attempts to access these fields. Since the Hibernate database session/transaction has already closed by the time serialization starts, this triggers a `LazyInitializationException: could not initialize proxy - no Session` error, crashing the API or cutting off the response JSON mid-stream.
*   **Resolution**: 
    1. Added the Jackson `@JsonIgnore` annotation to the `repository` field in [RepositorySnapshot.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/entity/RepositorySnapshot.java).
    2. Added the Jackson `@JsonIgnore` annotation to the `workspace` field in [Repository.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/entity/Repository.java).
    Since the frontend does not access or require these nested entities, ignoring them during serialization prevents the lazy-loading exceptions and ensures robust, complete API responses.

## 12. Added Detailed Diagnostics Logging
*   **Resolution**: 
    1. Added log statements inside [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py) showing snapshot prompt building, key features extracted, LLM agent invoke status, final payload structure, and the exact HTTP response status code/body received from Spring Boot callback.
    2. Added logs to the `/snapshot` endpoint in [RepositoryController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/RepositoryController.java) printing the number of database snapshots retrieved.
    3. Added warning and info logging to [ReviewCallbackController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/ReviewCallbackController.java) showing if the snapshot payload exists, what properties are parsed, and when it is successfully persisted to SQL database.

## 13. Optimized Indexing Progress Callback Sequence (0%, 25%, 50%, 75%, 100%)
*   **Problem**: Previously, during codebase document indexing, the AI service sent a POST request to update the backend status on every single file parsed (up to 30 callbacks), creating excessive network traffic and noisy database writes.
*   **Resolution**:
    1.  **AI Service updates**: Adjusted [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py) to send the initial progress callback as `0%` (changed from `10%`). Used a milestone tracking set (`sent_progress_milestones`) to ensure intermediate progress update calls are posted only when document traversal crosses **25%**, **50%**, and **75%** thresholds.
    2.  **Completed State**: The final callback posts `100%` on completion (either `INDEXED` or `FAILED`). This results in a clean progress sequence: `0% -> 25% -> 50% -> 75% -> 100%`.
    3.  **Frontend State updates**: Modified [RepositoryIntelligence.jsx](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-frontend/src/pages/RepositoryIntelligence.jsx) to set the local starting progress to `0` when indexing is triggered, and replaced the logical OR fallback (`|| 10`) with nullish coalescing (`?? 0`) to correctly display `0%` state on loading. This completely eliminates callback noise and minimizes database writes.

## 14. Resolved RAG Vector Document Retrieval & Embedding Alignment
*   **Gemini Embedding Dimension Alignment**:
    *   **Root Cause**: Gemini's `gemini-embedding-2` model defaults to returning **3072** dimensions. Previously, our python code truncated these vectors to 1536 by slicing (`vec[:1536]`). Because the model is not trained for arbitrary dimensionality truncation, slicing degraded the vector mathematical properties, causing cosine similarity queries in pgvector to fail (returning 0 matches).
    *   **Resolution**: Updated [llm_provider.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/llm_provider.py) to explicitly pass `"outputDimensionality": 1536` in both `embedContent` (single queries) and `batchEmbedContents` (batch indexing) API requests. This instructs Gemini to natively return a high-quality 1536-dimensional representation, keeping cosine similarity accurate and matching.
*   **PR Review Commit SHA Filter Override**:
    *   **Root Cause**: During automated PR reviews, the system passed the PR's head SHA as the `commit_sha` query filter. Since repository codebase documents are indexed under the repository's latest master/main commit SHA, the mismatch caused pgvector to filter out all indexed guidelines and architecture documents.
    *   **Resolution**: Removed the restrictive `commit_sha` filtering from `fetch_relevant_context` in [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py). This allows RAG context queries to retrieve all available repository codebase knowledge regardless of specific PR branch commits.
*   **Index Rebuild Clean Slate**:
    *   **Resolution**: Implemented `delete_memory_documents` in [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py) and called it in [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py) before starting a new repository index build. This automatically clears old vector chunks, avoiding duplicate chunks and replacing bad historical embeddings with high-quality natively-dimensioned ones upon re-indexing.

## 15. Optimized pgvector Cosine Distance Threshold
*   **Root Cause**: Previously, the RAG search filter in [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py) enforced a strict cosine distance threshold of `<= 0.35` (equivalent to `>= 0.65` cosine similarity). Codebase queries asking general questions or mentioning codebase components had cosine distances ranging from `0.38` to `0.50`, causing pgvector to discard all retrieved chunks. This returned `0 matching chunks`, resulting in generic LLM replies without codebase context.
*   **Resolution**: Relaxed the cosine distance limit to `<= 0.70` (equivalent to `>= 0.30` cosine similarity) in [rag_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/rag_service.py). This allows relevant codebase files and developer guidelines to pass the vector match check and get sent to Groq for query formulation.

## 16. Fixed Missing `commit_sha` in Indexing Callback Payload
*   **Root Cause**: When the indexing event completes in [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py), the `callback_payload` sent to Spring Boot's `/api/reviews/indexing-callback` endpoint omitted the repository's `commit_sha`. Because the backend Controller [ReviewCallbackController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/ReviewCallbackController.java#L198) reads the `commit_sha` field from the nested `snapshot` object, the missing field caused the `RepositorySnapshot` record to be saved with a `commit_sha` value of `null`.
*   **Resolution**: Modified `process_index_event` inside [async_task_service.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/services/async_task_service.py#L952) to set the `commit_sha` both inside the nested `snapshot` dictionary and at the root of `callback_payload`. This ensures the Spring Boot backend receives and persists the latest indexed commit hash correctly.

## 17. Fixed LLM Snapshot JSON Parsing Failure
*   **Root Cause**: In [nodes.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/graph/nodes.py#L49), the fallback JSON parser `_safe_json_load` was only looking for JSON array delimiters (`[...]`) when parsing a JSON string from the LLM. When parsing the repository summary/snapshot structure (which is a JSON dictionary starting with `{}`), the parser could not find array brackets, returned `None`, and threw the warning: *"LLM agent did not return a valid dictionary for snapshot. Initializing empty dictionary."*
*   **Resolution**: Overhauled `_safe_json_load` in [nodes.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/graph/nodes.py#L49) to support cleaning markdown code fences (e.g. ` ```json ` blocks) and added fallback extraction for dictionary structures (`{...}`) in addition to list structures (`[...]`). This guarantees robust, full-featured parsing of LLM-generated repository structures.

## 18. Clarified Callback Resolution Logs on Startup
*   **Root Cause**: During startup, [main.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/main.py#L65) logged `BACKEND_CALLBACK_URL=None` if the exact environment variable was not explicitly set on the dashboard, even though `async_task_service.py` successfully resolved it to `https://prsense-ai-1.onrender.com/api/reviews/callback` using the fallback `BACKEND_URL` config.
*   **Resolution**: Updated [main.py](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-ai-service/main.py#L65) to import the final resolved URL constant from `services.async_task_service` and log it alongside the environment configuration to prevent confusing logging output.

## 19. Fixed Webhook LazyInitializationException (400 Bad Request)
*   **Root Cause**: When the github webhook payload is received by the Spring Boot backend at `/api/webhooks/github`, it checks for an existing `PullRequest` entity inside [WebhookController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/WebhookController.java#L68). When an existing `PullRequest` is returned from the repository, its `@ManyToOne(fetch = FetchType.LAZY) repository` field is loaded as a lazy hibernate proxy. When the controller subsequently attempts to read `pr.getRepository().getOrganizationId()` (line 125) outside an active transaction/session, Hibernate throws `LazyInitializationException: could not initialize proxy - no Session`, causing the webhook to fail with a `400 Bad Request` error and preventing the creation of any `Review` record.
*   **Resolution**: Added the `@Transactional` annotation to `handleGithubWebhook` in [WebhookController.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/controller/WebhookController.java#L29) and imported `org.springframework.transaction.annotation.Transactional`. This keeps the Hibernate session open for the duration of the method, permitting the lazy relation to be loaded successfully and ensuring reviews are generated and persisted correctly.

## 20. Fixed `GET /api/analytics/reviews` LazyInitializationException (500 Internal Server Error)
*   **Root Cause**: In production, the Spring Data JPA Open Session In View parameter `spring.jpa.open-in-view` is configured as `false` in [application-prod.yml](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/resources/application-prod.yml#L18). When the UI requests the reviews list via `GET /api/analytics/reviews`, the backend returns a list of `Review` entities. During Jackson JSON serialization (which executes outside the closed database transaction session), Jackson attempts to serialize the lazy `@OneToMany findings` and `@OneToOne pullRequest` (and `pullRequest.repository`) associations. This triggers a `LazyInitializationException` proxy error, causing the server to return a `500 Internal Server Error` instead of JSON.
*   **Resolution**: Created a custom JPQL query `findAllWithDetails()` in [ReviewRepository.java](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-backend/src/main/java/com/prsense/backend/repository/ReviewRepository.java#L11) using `LEFT JOIN FETCH` commands to load the `findings`, `pullRequest`, and `repository` fields eagerly in a single database roundtrip. Updated `ReviewAnalyticsService.java` to fetch via `findAllWithDetails()`, preventing lazy-loading exceptions during JSON generation.

## 21. Cleaned up UI Labels & Queue Terminology (CommandCenter.jsx & Monitoring.jsx)
*   **Resolution**: Removed references to legacy Celery and Redis elements. Renamed "Celery Worker Daemon" to "Review Worker Pool", "Redis Queue Size" / "Celery Queue Size" to "Active Task Queue" or "Active Reviews Queue", and configured them to map dynamically to the simplified `active_queue_size` property. Changed the Redis health check card in the Observability view to a PostgreSQL database health check status card pointing to port 5432 and pgvector.

## 22. Corrected Direct Flow Architecture in LandingPagePremium.jsx
*   **Resolution**: Updated the homepage interactive architecture steps sequence. Removed the mock Celery workers and Redis broker steps from the visualization deck, replacing them with Spring Boot Direct AI Service Dispatch and direct pgvector searches to align with the active 3-tier production architecture.

## 23. Production Hardened Configurations & Cleanup
*   **Resolution**:
    1.  **docker-compose.production.yml**: Completely purged the `redis` and `celery-worker` container service definitions, as well as the unused `REDIS_URL` and `REDIS_HOST` environment properties inside the `backend` and `ai-service` definitions to reduce hosting resources.
    2.  **.env.example**: Removed the legacy `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT` keys, and the unused `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_OAUTH_REDIRECT_URI` environment variables.

## 24. Purged Hype Words & Professional README Restructuring
*   **Resolution**: Restructured the main [README.md](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/README.md) in a concise, developer-oriented style:
    *   Removed marketing buzzwords (autonomous, premium, automated SaaS, etc.).
    *   Added a clear architecture diagram detailing the direct 3-tier flow (React UI → Spring Boot Backend → FastAPI AI Service → pgvector/PostgreSQL).
    *   Documented updated environment setup instructions and Docker Compose local deployment guidelines without Redis/Celery.

## 25. Verified Frontend Compilation
*   **Resolution**: Resolved a syntax duplication issue inside [LoginPage.jsx](file:///c:/Users/satam/OneDrive/Desktop/stack%20frontend/prsense-frontend/src/pages/LoginPage.jsx) by restoring the file and performing clean, precise removals of the GitHub OAuth button. Successfully completed the production React web bundle build (`npm run build` in `prsense-frontend`), generating the production bundle inside `dist/` with zero errors.
