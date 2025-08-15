import threading
import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)

class ThreadSafeApiKeyManager:
    """
    Thread-safe API key manager with round-robin distribution.
    Optimized for high concurrency (1000+ simultaneous users).
    """
    def __init__(self, api_keys: List[str]):
        if not api_keys:
            logger.critical("CRITICAL: No Gemini API keys found. Service will fail on first request.")
            self.api_keys = []
            self._current_index = 0
        else:
            self.api_keys = api_keys
            self._current_index = 0
            logger.info(f"Loaded {len(api_keys)} Gemini API key(s) with thread-safe rotation.")
        
        # Thread-safe lock for key rotation
        self._lock = threading.Lock()

    def get_next_key(self) -> str:
        """
        Returns the next API key in a thread-safe round-robin fashion.
        Optimized for minimal lock contention.
        """
        if not self.api_keys:
            raise ValueError("No API keys available to use.")
        
        with self._lock:
            key = self.api_keys[self._current_index]
            self._current_index = (self._current_index + 1) % len(self.api_keys)
            return key

    def get_key_count(self) -> int:
        """Returns the number of available API keys."""
        return len(self.api_keys)

# Create singleton instance
key_manager = ThreadSafeApiKeyManager(settings.GEMINI_API_KEYS)