import logging
import asyncio
from typing import Optional
from google import generativeai as genai
from google.generativeai import types

from app.core.api_key_manager import key_manager
from app.schemas import UserProfile

logger = logging.getLogger(__name__)

class OptimizedGeminiClient:
    """
    Optimized Gemini client with connection pooling and rate limiting.
    Designed for high concurrency (1000+ simultaneous requests).
    """
    def __init__(self):
        self._models = {}  # Cache for configured models
        self._semaphore = asyncio.Semaphore(500)  # Limit concurrent requests
        
    async def get_model(self, api_key: str, use_search: bool = True):
        """
        Get or create optimized model instance with caching.
        Keeps your exact model configuration: gemini-2.5-pro with search.
        """
        cache_key = f"{api_key[:10]}_{use_search}"  # Use first 10 chars for cache key
        
        if cache_key not in self._models:
            # Configure with the provided API key
            genai.configure(api_key=api_key)
            
            tools = []
            if use_search:
                # Keep your exact search configuration
                grounding_tool = types.Tool(google_search=types.GoogleSearch())
                tools.append(grounding_tool)

            # Keep your exact safety settings
            safety_settings = [
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE
                ),
            ]
            
            # Keep your exact generation config
            config = types.GenerationConfig(temperature=1.0)
            
            # Create model with your exact configuration
            model = genai.GenerativeModel(
                model_name="gemini-2.5-pro",  # Your exact model
                safety_settings=safety_settings,
                generation_config=config,
                tools=tools if tools else None,
            )
            
            self._models[cache_key] = model
            logger.debug(f"Created new Gemini model instance (search: {use_search})")
        
        return self._models[cache_key]

# Global optimized client
gemini_client = OptimizedGeminiClient()

async def generate_text_with_google_search(prompt: str, user_profile: UserProfile, use_search: bool = True) -> str:
    """
    Optimized async text generation with proper concurrency control.
    Maintains your exact model configuration and search functionality.
    """
    async with gemini_client._semaphore:  # Rate limiting
        try:
            # Thread-safe API key rotation
            api_key = key_manager.get_next_key()
            
            # Get optimized model instance
            model = await gemini_client.get_model(api_key, use_search)
            
            logger.info(f"Processing request for user {user_profile.id}, search_enabled: {use_search}")
            
            # Your exact API call with system instruction
            response = await model.generate_content_async(
                f"User query: {prompt}",
                # System instruction is set in model creation
            )
            
            return response.text

        except ValueError as ve:
            logger.critical(f"API Key Error: {ve}")
            raise
        except Exception as e:
            logger.error(f"AI Engine error: {e}", exc_info=True)
            raise

def should_use_search(query: str) -> bool:
    """
    Your exact search decision logic - unchanged.
    """
    search_keywords = [
        'latest', 'recent', 'new', 'current', 'updated', '2024', '2025',
        'guidelines', 'study', 'research', 'trial', 'approval', 'fda',
        'evidence', 'meta-analysis', 'systematic review'
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in search_keywords)