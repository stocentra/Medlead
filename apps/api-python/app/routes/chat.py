import logging
import asyncio
import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from app.core.security import get_current_user
from app.schemas import ChatRequest, ChatResponse, UserProfile, TrainingRecord
from app.core.prompt_engine import create_prompt
from app.core.ai_engine import generate_text_with_google_search, should_use_search
from app.core.storage.r2 import R2Uploader, get_uploader

logger = logging.getLogger(__name__)
router = APIRouter()

class CircuitBreaker:
    """
    Circuit breaker pattern for handling Gemini API failures.
    Prevents cascade failures under high load.
    """
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    def call_allowed(self) -> bool:
        """Check if calls are allowed through the circuit breaker."""
        if self.state == "CLOSED":
            return True
        elif self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
                logger.info("Circuit breaker moving to HALF_OPEN state")
                return True
            return False
        else:  # HALF_OPEN
            return True
    
    def record_success(self):
        """Record successful call."""
        if self.state == "HALF_OPEN":
            self.state = "CLOSED"
            self.failure_count = 0
            logger.info("Circuit breaker CLOSED - service recovered")
    
    def record_failure(self):
        """Record failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(f"Circuit breaker OPEN - {self.failure_count} failures")

class RateLimiter:
    """
    Advanced rate limiter with sliding window algorithm.
    Handles burst traffic and prevents API abuse.
    """
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}  # user_id -> list of timestamps
    
    async def is_allowed(self, user_id: str) -> tuple[bool, Optional[int]]:
        """
        Check if user is within rate limits.
        Returns (is_allowed, retry_after_seconds)
        """
        now = time.time()
        
        # Clean old requests
        if user_id in self.requests:
            self.requests[user_id] = [
                req_time for req_time in self.requests[user_id]
                if now - req_time < self.window_seconds
            ]
        else:
            self.requests[user_id] = []
        
        # Check rate limit
        if len(self.requests[user_id]) >= self.max_requests:
            oldest_request = min(self.requests[user_id])
            retry_after = int(self.window_seconds - (now - oldest_request)) + 1
            return False, retry_after
        
        # Allow request and record it
        self.requests[user_id].append(now)
        return True, None

class OptimizedBackgroundTasks:
    """
    Optimized background task manager with queue limits and error handling.
    Prevents memory issues under high load.
    """
    def __init__(self, max_queue_size: int = 1000):
        self.max_queue_size = max_queue_size
        self.queue_size = 0
    
    async def safe_upload_training_data(self, uploader: R2Uploader, data: dict):
        """Safely upload training data with error handling."""
        try:
            await uploader.upload_training_data(data)
            logger.debug("Training data uploaded successfully")
        except Exception as e:
            logger.error(f"Failed to upload training data: {e}")
            # Don't raise - background task failure shouldn't affect user response
        finally:
            self.queue_size -= 1
    
    def add_training_task(self, background_tasks: BackgroundTasks, uploader: R2Uploader, data: dict):
        """Add training data upload task with queue management."""
        if self.queue_size >= self.max_queue_size:
            logger.warning("Background task queue full, dropping training data upload")
            return
        
        self.queue_size += 1
        background_tasks.add_task(self.safe_upload_training_data, uploader, data)

# Global instances
circuit_breaker = CircuitBreaker(failure_threshold=10, recovery_timeout=30)
rate_limiter = RateLimiter(max_requests=50, window_seconds=60)  # 50 requests per minute per user
bg_task_manager = OptimizedBackgroundTasks()

async def validate_request(request: ChatRequest, user: UserProfile) -> None:
    """
    Comprehensive request validation for high-load scenarios.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty"
        )
    
    # Prevent extremely long queries that could cause timeouts
    if len(request.query) > 8000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query too long. Maximum 8000 characters allowed"
        )
    
    # Validate history length to prevent memory issues
    if request.history and len(request.history) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="History too long. Maximum 50 messages allowed"
        )
    
    # Rate limiting check
    allowed, retry_after = await rate_limiter.is_allowed(str(user.id))
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again in {retry_after} seconds",
            headers={"Retry-After": str(retry_after)}
        )

@router.post("", response_model=ChatResponse)
async def handle_chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
    current_user: UserProfile = Depends(get_current_user),
    uploader: R2Uploader = Depends(get_uploader)
):
    """
    Optimized chat handler for 1000+ concurrent users.
    Includes circuit breaker, rate limiting, and proper error handling.
    """
    start_time = time.time()
    
    try:
        # Validate request and rate limits
        await validate_request(request, current_user)
        
        # Check circuit breaker
        if not circuit_breaker.call_allowed():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service temporarily unavailable. Please try again later.",
                headers={"Retry-After": "30"}
            )
        
        # Create prompt
        final_prompt = create_prompt(
            user_profile=current_user,
            user_query=request.query,
            history=request.history or []
        )

        # Intelligent search decision
        use_search = should_use_search(request.query)
        logger.info(f"Processing query for user {current_user.id}: "
                   f"length={len(request.query)}, search={use_search}")

        # Generate AI response with timeout
        try:
            ai_response_text = await asyncio.wait_for(
                generate_text_with_google_search(
                    prompt=final_prompt,
                    user_profile=current_user,
                    use_search=use_search
                ),
                timeout=30.0  # 30 second timeout per request
            )
            
            # Record success for circuit breaker
            circuit_breaker.record_success()
            
        except asyncio.TimeoutError:
            logger.warning(f"Request timeout for user {current_user.id}")
            circuit_breaker.record_failure()
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Request timed out. Please try again with a shorter query."
            )

        # Optimize training data collection
        training_record = TrainingRecord(
            user_id=str(current_user.id),
            user_profile=current_user.model_dump(exclude={'id'}),
            final_prompt="<ANONYMIZED>",  # Privacy protection
            model_response=ai_response_text[:1000],  # Limit response size
            timestamp_utc=datetime.now(timezone.utc).isoformat()
        )
        
        # Add background task with queue management
        bg_task_manager.add_training_task(
            background_tasks, 
            uploader, 
            training_record.model_dump()
        )

        # Performance logging
        response_time = time.time() - start_time
        logger.info(f"Request completed for user {current_user.id}: "
                   f"{response_time:.2f}s, response_length={len(ai_response_text)}")

        return ChatResponse(response=ai_response_text)

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    
    except ValueError as ve:
        # API key configuration errors
        logger.critical(f"API Key error for user {current_user.id}: {ve}")
        circuit_breaker.record_failure()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service configuration error. Please contact support."
        )
    
    except Exception as e:
        # Unexpected errors
        logger.error(f"Unexpected error for user {current_user.id}: {e}", exc_info=True)
        circuit_breaker.record_failure()
        
        # Don't expose internal errors to users
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred. Please try again."
        )

@router.get("/health", tags=["Health"])
async def chat_health():
    """Health check endpoint with circuit breaker status."""
    return {
        "status": "healthy",
        "circuit_breaker": circuit_breaker.state,
        "background_queue": bg_task_manager.queue_size
    }

@router.get("/metrics", tags=["Metrics"])
async def chat_metrics():
    """Metrics endpoint for monitoring."""
    return {
        "circuit_breaker_state": circuit_breaker.state,
        "failure_count": circuit_breaker.failure_count,
        "background_queue_size": bg_task_manager.queue_size,
        "active_users": len(rate_limiter.requests)
    }
