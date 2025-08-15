from pydantic import BaseModel, UUID4, Field, validator
from typing import Optional, List, Literal, Dict, Any

class UserProfile(BaseModel):
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
        from_attributes = True
        # Performance optimization for high concurrency
        validate_assignment = False  # Skip validation on assignment for speed
        use_enum_values = True

class HistoryMessage(BaseModel):
    role: Literal['user', 'model']
    content: str = Field(..., max_length=4000)  # Prevent extremely long messages
    
    @validator('content')
    def validate_content(cls, v):
        if not v or not v.strip():
            raise ValueError('Content cannot be empty')
        return v.strip()
    
    class Config:
        validate_assignment = False  # Performance optimization

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=8000)
    history: Optional[List[HistoryMessage]] = Field(default_factory=list, max_items=50)
    
    @validator('query')
    def validate_query(cls, v):
        if not v or not v.strip():
            raise ValueError('Query cannot be empty')
        return v.strip()
    
    @validator('history')
    def validate_history_length(cls, v):
        if v and len(v) > 50:
            raise ValueError('History cannot exceed 50 messages')
        return v
    
    class Config:
        validate_assignment = False

class ChatResponse(BaseModel):
    response: str
    
    # Optional metadata for monitoring
    processing_time_ms: Optional[int] = None
    tokens_used: Optional[int] = None
    search_enabled: Optional[bool] = None
    
    class Config:
        validate_assignment = False

class TrainingRecord(BaseModel):
    """
    Optimized training record with size limits for efficient storage.
    """
    user_id: str = Field(..., max_length=36)  # UUID string length
    user_profile: Dict[str, Any]
    final_prompt: str = Field(default="<ANONYMIZED>", max_length=100)  # Privacy + size limit
    model_response: str = Field(..., max_length=2000)  # Limit response size for storage
    timestamp_utc: str = Field(..., max_length=32)  # ISO format length
    
    @validator('model_response')
    def truncate_response(cls, v):
        """Truncate long responses for storage efficiency."""
        if len(v) > 2000:
            return v[:1997] + "..."
        return v
    
    class Config:
        validate_assignment = False

# Performance-optimized models for high-frequency operations
class HealthCheck(BaseModel):
    """Lightweight health check response."""
    status: Literal["ok", "degraded", "down"] = "ok"
    timestamp: Optional[str] = None
    
    class Config:
        validate_assignment = False

class MetricsResponse(BaseModel):
    """Lightweight metrics response."""
    concurrent_users: int
    api_keys_available: int
    circuit_breaker_state: str
    background_queue_size: int
    
    class Config:
        validate_assignment = False