from pydantic import BaseModel, UUID4
from typing import Optional, List

# This class MUST be defined here for the import to work.
class ChatRequest(BaseModel):
    """
    Defines the structure of the incoming request body for the chat endpoint.
    """
    query: str
    # We can add more fields like conversation_history later.

class UserProfile(BaseModel):
    """
    Represents the user profile data fetched from the database.
    This model should reflect the structure of your 'profiles' table.
    """
    id: UUID4
    full_name: Optional[str] = None
    professional_level: Optional[str] = None
    country: Optional[str] = None
    system_role: str
    specialty_name: Optional[str] = None # This will be fetched via a DB join

    class Config:
        # This allows creating the model from a dictionary or ORM object
        from_attributes = True