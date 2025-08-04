import itertools
from app.core.config import settings # This import was already correct

class ApiKeyManager:
    def __init__(self, api_keys: list[str]):
        if not api_keys:
            raise ValueError("No Gemini API keys found in the configuration.")
        self.api_keys = itertools.cycle(api_keys)

    def get_next_key(self) -> str:
        return next(self.api_keys)

key_manager = ApiKeyManager(settings.GEMINI_API_KEYS)