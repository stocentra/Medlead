import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class OptimizedSettings(BaseSettings):
    """
    Optimized configuration for high-concurrency deployment.
    Includes performance tuning parameters.
    """
    # Original settings
    GO_API_URL: str
    GEMINI_API_KEYS: List[str] = []
    MODEL_PERSONA: str
    SYSTEM_PREAMBLE: str

    # R2 Configuration
    R2_ENDPOINT_URL: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_TRAINING_BUCKET_NAME: Optional[str] = None
    
    # Performance optimization settings
    DEBUG: bool = False
    MAX_CONCURRENT_REQUESTS: int = 500
    CONNECTION_POOL_SIZE: int = 200
    CONNECTION_TIMEOUT: float = 5.0
    READ_TIMEOUT: float = 10.0
    
    # Rate limiting
    REQUESTS_PER_MINUTE: int = 1000
    BURST_LIMIT: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **values):
        super().__init__(**values)
        
        # Load API keys dynamically (your original logic)
        i = 1
        while True:
            key = os.getenv(f"GEMINI_API_KEY_{i}")
            if key:
                self.GEMINI_API_KEYS.append(key)
                i += 1
            else:
                break
        
        if not self.GEMINI_API_KEYS:
            print("WARNING: No GEMINI_API_KEY_n variables found.")
        
        # Set debug mode
        self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        
        # Performance tuning based on environment
        if os.getenv("ENVIRONMENT") == "production":
            self.MAX_CONCURRENT_REQUESTS = 1000
            self.CONNECTION_POOL_SIZE = 500
            self.REQUESTS_PER_MINUTE = 2000
        
        print(f"Configuration loaded: {len(self.GEMINI_API_KEYS)} API keys, "
              f"max_concurrent: {self.MAX_CONCURRENT_REQUESTS}, "
              f"debug: {self.DEBUG}")

settings = OptimizedSettings()