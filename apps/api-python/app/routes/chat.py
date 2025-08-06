import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.schemas import ChatRequest, ChatResponse, UserProfile
from app.core.prompt_engine import create_prompt
from app.core.ai_engine import generate_text_with_google_search

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Handles the main chat interaction by building a prompt and passing it
    to the AI engine for a grounded response.
    """
    if not request.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User query cannot be empty."
        )

    try:
        final_prompt = create_prompt(user_profile=current_user, user_query=request.query)
        
        ai_response_text = generate_text_with_google_search(prompt=final_prompt, user_profile=current_user)

        logger.info(f"Successfully processed chat request for user {current_user.id}")
        return ChatResponse(response=ai_response_text)

    except ValueError as ve:
        logger.critical(f"API Key configuration error for user {current_user.id}: {ve}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service is not configured correctly. Please contact support."
        )
    except Exception as e:
        logger.error(f"An internal server error occurred for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing your request."
        )