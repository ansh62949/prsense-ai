import os
import logging
import time
from typing import Any, Dict, Optional

logger = logging.getLogger("PRSenseLangfuseService")
logger.setLevel(logging.INFO)

# Load configuration
LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY", "")
LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY", "")
LANGFUSE_HOST = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

try:
    from langfuse import Langfuse
    # Only enable if keys are provided
    if LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY:
        langfuse_client = Langfuse(
            public_key=LANGFUSE_PUBLIC_KEY,
            secret_key=LANGFUSE_SECRET_KEY,
            host=LANGFUSE_HOST
        )
        logger.info("Langfuse service initialized and enabled.")
    else:
        langfuse_client = None
        logger.info("Langfuse credentials missing; running in mock logger mode.")
except ImportError:
    langfuse_client = None
    logger.info("langfuse package not installed; running in mock logger mode.")

class MockSpan:
    def __init__(self, name: str, parent: Optional['MockSpan'] = None):
        self.name = name
        self.parent = parent
        self.start_time = time.perf_counter()
        
    def end(self, output: Any = None, level: str = "DEFAULT", status_message: str = "", usage: Optional[Dict] = None):
        duration = (time.perf_counter() - self.start_time) * 1000
        logger.info(f"[TELEMETRY TRACE] End Span '{self.name}' - Duration: {duration:.1f}ms - Status: {level} {status_message} - Usage: {usage}")

class MockTrace:
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name
        self.start_time = time.perf_counter()
        
    def span(self, name: str, input: Any = None, metadata: Optional[Dict] = None) -> MockSpan:
        logger.info(f"[TELEMETRY TRACE] Start Span '{name}' on Trace '{self.name}' ({self.id}) - Input size: {len(str(input)) if input else 0}")
        return MockSpan(name)
        
    def update(self, output: Any = None, metadata: Optional[Dict] = None):
        duration = (time.perf_counter() - self.start_time) * 1000
        logger.info(f"[TELEMETRY TRACE] End Trace '{self.name}' ({self.id}) - Duration: {duration:.1f}ms")

class LangfuseService:
    def __init__(self):
        self.enabled = langfuse_client is not None

    def start_trace(self, trace_id: str, name: str, user_id: Optional[str] = None, metadata: Optional[Dict] = None) -> Any:
        if self.enabled:
            try:
                return langfuse_client.trace(
                    id=trace_id,
                    name=name,
                    user_id=user_id,
                    metadata=metadata
                )
            except Exception as e:
                logger.warning(f"Failed to start Langfuse trace: {e}")
        return MockTrace(trace_id, name)

    def log_generation(
        self,
        trace_or_span: Any,
        name: str,
        prompt: str,
        completion: str,
        model: str,
        tokens_in: int,
        tokens_out: int,
        cost: float,
        duration_ms: int,
        metadata: Optional[Dict] = None
    ):
        if self.enabled and hasattr(trace_or_span, "generation"):
            try:
                trace_or_span.generation(
                    name=name,
                    model=model,
                    input=prompt,
                    output=completion,
                    usage={
                        "input": tokens_in,
                        "output": tokens_out
                    },
                    metadata=metadata
                )
                return
            except Exception as e:
                logger.warning(f"Failed to log Langfuse generation: {e}")
        
        logger.info(
            f"[TELEMETRY GENERATION] {name} ({model}) - Duration: {duration_ms}ms, "
            f"Tokens: {tokens_in} in / {tokens_out} out, Cost: ${cost:.6f}"
        )

langfuse_service = LangfuseService()
