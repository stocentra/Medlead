from pydantic import BaseModel, UUID4
from typing import Optional

# --- User related models ---

class UserProfile(BaseModel):
    """
    Represents the user profile data fetched from the Go service.
    This model mirrors the JSON response from the /v1/users/me endpoint.
    """
    id: UUID4
    email: str
    full_name: str
    country: str
    system_role: str
    professional_level: str
    verification_status: str
    specialty_id: Optional[int] = None
    specialty_name: Optional[str] = None

    class Config:
        # Allows creating the model directly from a dictionary
        from_attributes = True


# --- Chat related models ---

class ChatRequest(BaseModel):
    """
    Defines the structure of the incoming request body for the chat endpoint.
    """
    query: str
    # Later we can add: conversation_history: Optional[list] = None

class ChatResponse(BaseModel):
    """
    Defines the structure for the AI's response.
    """
    response: str
    # Later we can add: sources: Optional[list] = None