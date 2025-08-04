import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import List

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """
    Loads configuration from environment variables.
    """
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Gemini API Keys - This list will be populated manually below
    GEMINI_API_KEYS: List[str] = []

    # Prompt Engineering
    MODEL_PERSONA: str
    SYSTEM_PREAMBLE: str

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        # --- THE FIX IS HERE ---
        # This tells Pydantic to ignore any environment variables
        # that are not explicitly defined in the Settings model above.
        extra = 'ignore'

    def __init__(self, **values):
        # This custom constructor runs AFTER Pydantic has loaded its known fields.
        super().__init__(**values)
        # Now, we manually read the Gemini keys from the environment.
        i = 1
        while True:
            key = os.getenv(f"GEMINI_API_KEY_{i}")
            if key:
                self.GEMINI_API_KEYS.append(key)
                i += 1
            else:
                break
        
        # Add a check to ensure at least one key was loaded
        if not self.GEMINI_API_KEYS:
            raise ValueError("No GEMINI_API_KEY_n variables found in the environment.")


# Create a single instance of the settings to be used across the application
settings = Settings()