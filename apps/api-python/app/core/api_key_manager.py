import itertools
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class ApiKeyManager:
    """
    A simple thread-safe manager to cycle through a list of API keys.
    """
    def __init__(self, api_keys: list[str]):
        if not api_keys:
            logger.critical("CRITICAL: No Gemini API keys were found in the configuration. The service will not be able to process AI requests.")
            # We don't raise an error here to allow the app to start,
            # but it will fail on the first request.
            self.api_keys = itertools.cycle([])
        else:
            self.api_keys = itertools.cycle(api_keys)
            logger.info(f"Loaded {len(api_keys)} Gemini API key(s).")

    def get_next_key(self) -> str:
        """
        Returns the next available API key in a round-robin fashion.
        """
        try:
            return next(self.api_keys)
        except StopIteration:
            # This happens if the initial list was empty.
            raise ValueError("No API keys available to use.")

# Create a single, importable instance of the key manager
key_manager = ApiKeyManager(settings.GEMINI_API_KEYS)