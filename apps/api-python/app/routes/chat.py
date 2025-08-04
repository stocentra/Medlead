from fastapi import APIRouter, HTTPException
from .. import models # Relative import from the parent directory's models.py
import uuid


# Create a new router for chat-related endpoints
router = APIRouter(
    prefix="/v1/chat",
    tags=["Chat"]
)

@router.post("/", response_model=models.ChatResponse)
async def handle_chat_request(request: models.ChatRequest):
    """
    Handles the main chat request from a user.
    
    For now, it returns a simple echo response.
    """
    if not request.query_text:
        raise HTTPException(status_code=400, detail="query_text cannot be empty")

    # Generate a new conversation ID if one isn't provided
    conversation_id = request.conversation_id or str(uuid.uuid4())

    # --- AI Logic will go here in the future ---
    # For now, we just echo the message back.
    ai_response_text = f"AI received your message: '{request.query_text}'"

    return models.ChatResponse(
        conversation_id=conversation_id,
        response_text=ai_response_text
    )