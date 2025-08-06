import logging
from google import genai
from google.genai import types

from app.core.api_key_manager import key_manager
from app.schemas import UserProfile

logger = logging.getLogger(__name__)

def generate_text_with_google_search(prompt: str, user_profile: UserProfile, use_search: bool = True) -> str:
    """
    Generates a response from the Gemini API using the specified prompt.
    Google Search can be enabled/disabled based on query complexity.
    """
    try:
        api_key = key_manager.get_next_key()
        client = genai.Client(api_key=api_key)

        # Only use Google Search for complex medical queries
        tools = []
        if use_search:
            grounding_tool = types.Tool(google_search=types.GoogleSearch())
            tools.append(grounding_tool)

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
            tools=tools if tools else None,
            safety_settings=safety_settings,
            system_instruction=prompt
        )

        # Log the actual user query for debugging
        logger.info(f"Sending query to Gemini for user {user_profile.id}, search_enabled: {use_search}")
        
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


def should_use_search(query: str) -> bool:
    """
    Determines if a query needs Google Search based on keywords and complexity
    """
    search_keywords = [
        'latest', 'recent', 'new', 'current', 'updated', '2024', '2025',
        'guidelines', 'study', 'research', 'trial', 'approval', 'fda',
        'evidence', 'meta-analysis', 'systematic review'
    ]
    
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in search_keywords)