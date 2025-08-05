import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import List

load_dotenv()

class Settings(BaseSettings):
    """
    Loads all configuration from environment variables.
    """
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    GEMINI_API_KEYS: List[str] = []
    MODEL_PERSONA: str
    SYSTEM_PREAMBLE: str
    
    # --- THE FIX IS HERE ---
    # The public URL for the Go service.
    GO_API_URL: str

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = 'ignore'

    def __init__(self, **values):
        super().__init__(**values)
        
        # Load Gemini API keys
        i = 1
        while True:
            key = os.getenv(f"GEMINI_API_KEY_{i}")
            if key:
                self.GEMINI_API_KEYS.append(key)
                i += 1
            else:
                break
        
        if not self.GEMINI_API_KEYS:
            raise ValueError("No GEMINI_API_KEY_n variables found in the environment.")

settings = Settings()