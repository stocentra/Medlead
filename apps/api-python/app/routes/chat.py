from fastapi import APIRouter, Depends, HTTPException, status
import requests

from app.core.security import get_current_user
from app.models.schemas import ChatRequest, UserProfile
from app.core.prompt_engine import create_prompt
from app.core.api_key_manager import key_manager

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

@router.post("")
async def handle_chat(request: ChatRequest, current_user: UserProfile = Depends(get_current_user)):
    """
    Handles the main, production-ready chat interaction. It is protected
    and uses the authenticated user's profile to build the prompt.
    """
    if not request.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User query cannot be empty."
        )

    try:
        api_key = key_manager.get_next_key()
        final_prompt = create_prompt(user_profile=current_user, user_query=request.query)
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={api_key}"
        
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "contents": [{"parts": [{"text": final_prompt}]}],
            "tools": [{"Google Search": {}}],
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ],
            "generationConfig": {"temperature": 1.0}
        }
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        final_text_response = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', "Error: Could not extract a valid response from the model.")

        return {"response": final_text_response}

    except requests.exceptions.HTTPError as http_err:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Error from Google API: {response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred: {e}"
        )