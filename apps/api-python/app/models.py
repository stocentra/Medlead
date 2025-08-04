from pydantic import BaseModel
from typing import Optional

# It is crucial that these class definitions are present in this file.

class ChatRequest(BaseModel):
    """
    Defines the structure for an incoming chat request.
    """
    user_id: str
    conversation_id: Optional[str] = None
    query_text: str

class ChatResponse(BaseModel):
    """
    Defines the structure for the AI's response.
    """
    conversation_id: str
    response_text: str