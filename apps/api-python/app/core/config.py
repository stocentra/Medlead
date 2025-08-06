import os
from pydantic_settings import BaseSettings
from typing import List

# .env file is loaded automatically by pydantic_settings

class Settings(BaseSettings):
    """
    Loads all configuration from environment variables.
    Pydantic performs automatic validation for these settings.
    """
    # --- Service Connectivity ---
    GO_API_URL: str # The public URL for the Go service (e.g., https://api.medlead.ir)

    # --- Gemini API Configuration ---
    GEMINI_API_KEYS: List[str] = [] # Will be populated from GEMINI_API_KEY_n variables

    # --- Prompt Engineering Configuration ---
    MODEL_PERSONA: str
    SYSTEM_PREAMBLE: str
    
    class Config:
        env_file = ".env"
        case_sensitive = True # Ensures variable names match exactly

    def __init__(self, **values):
        super().__init__(**values)
        # Custom logic to load multiple Gemini API keys
        i = 1
        while True:
            key = os.getenv(f"GEMINI_API_KEY_{i}")
            if key:
                self.GEMINI_API_KEYS.append(key)
                i += 1
            else:
                break
        
        if not self.GEMINI_API_KEYS:
            # This check is important for production stability
            print("WARNING: No GEMINI_API_KEY_n variables found in the environment. AI service will fail.")

# Create a single, importable instance of the settings
settings = Settings()