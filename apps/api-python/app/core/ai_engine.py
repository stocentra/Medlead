import logging
from google import genai
from google.genai import types

from app.core.api_key_manager import key_manager
from app.schemas import UserProfile

logger = logging.getLogger(__name__)

def generate_text_with_google_search(prompt: str, user_profile: UserProfile) -> str:
    """
    Generates a response from the Gemini API using the specified prompt.
    Google Search temporarily disabled for debugging timeout issues.
    """
    try:
        api_key = key_manager.get_next_key()
        client = genai.Client(api_key=api_key)

        # Temporarily comment out Google Search tool to debug timeout
        # grounding_tool = types.Tool(google_search=types.GoogleSearch())

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
        
        config = types.GenerateContentConfig(
            temperature=1.0,
            # tools=[grounding_tool],  # Commented out temporarily
            safety_settings=safety_settings,
            system_instruction=prompt
        )

        # Log the actual user query for debugging
        logger.info(f"Sending query to Gemini for user {user_profile.id}")
        
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=f"User query: {prompt}",
            config=config
        )
        
        return response.text

    except ValueError as ve:
        logger.critical(f"API Key Error in AI Engine: {ve}")
        raise
    except Exception as e:
        logger.error(f"An unexpected error occurred in the AI Engine: {e}", exc_info=True)
        raise