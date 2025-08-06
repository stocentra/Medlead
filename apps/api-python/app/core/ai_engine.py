# In: api-python/app/core/ai_engine.py
import logging
import google.generativeai as genai
from google.generativeai.types import GenerationConfig, SafetySetting, HarmCategory, Tool

from app.core.api_key_manager import key_manager
from app.schemas import UserProfile

logger = logging.getLogger(__name__)

def generate_text_with_google_search(prompt: str, user_profile: UserProfile) -> str:
    """
    Generates a response from the Gemini API using the specified prompt,
    with Google Search grounding enabled. This is the core AI function.
    """
    try:
        api_key = key_manager.get_next_key()
        genai.configure(api_key=api_key)

        # Define the Google Search tool with correct syntax
        grounding_tool = Tool(
            google_search_retrieval={}
        )

        safety_settings = [
            SafetySetting(category=HarmCategory.HARM_CATEGORY_HARASSMENT, threshold="BLOCK_NONE"),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold="BLOCK_NONE"),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold="BLOCK_NONE"),
            SafetySetting(category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold="BLOCK_NONE"),
        ]
        
        generation_config = GenerationConfig(
            temperature=1.0,
            tools=[grounding_tool]
        )

        # Use the correct gemini-2.5-pro model
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            generation_config=generation_config,
            safety_settings=safety_settings,
            system_instruction=prompt
        )
        
        response = model.generate_content("")
        
        return response.text

    except ValueError as ve:
        logger.critical(f"API Key Error in AI Engine: {ve}")
        raise
    except Exception as e:
        logger.error(f"An unexpected error occurred in the AI Engine: {e}", exc_info=True)
        raise