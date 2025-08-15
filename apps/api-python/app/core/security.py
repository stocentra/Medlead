import logging
import asyncio
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError
import httpx

from app.core.config import settings
from app.schemas import UserProfile

logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class OptimizedHttpClient:
    """
    Optimized HTTP client with proper connection pooling for high concurrency.
    Handles 1000+ simultaneous connections efficiently.
    """
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._lock = asyncio.Lock()

    async def get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client with optimized settings."""
        if self._client is None:
            async with self._lock:
                if self._client is None:
                    # Optimized connection limits for high concurrency
                    limits = httpx.Limits(
                        max_keepalive_connections=200,
                        max_connections=1000,
                        keepalive_expiry=30.0
                    )
                    
                    timeout = httpx.Timeout(
                        connect=5.0,
                        read=10.0,
                        write=5.0,
                        pool=2.0
                    )
                    
                    self._client = httpx.AsyncClient(
                        limits=limits,
                        timeout=timeout,
                        http2=True  # Enable HTTP/2 for better performance
                    )
                    logger.info("Initialized optimized HTTP client for high concurrency")
        
        return self._client

    async def close(self):
        """Properly close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

# Global HTTP client manager
http_manager = OptimizedHttpClient()

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserProfile:
    """
    Optimized user validation with proper connection pooling.
    Handles high concurrency without connection issues.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    go_api_url = f"{settings.GO_API_URL}/v1/users/me"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        client = await http_manager.get_client()
        
        response = await client.get(go_api_url, headers=headers)
        
        if response.status_code == 401:
            logger.warning("Token validation failed by Go API")
            raise credentials_exception
        
        response.raise_for_status()
        profile_data = response.json()
        user_profile = UserProfile(**profile_data)
        
        return user_profile

    except httpx.ConnectTimeout:
        logger.error(f"Connection timeout to Go service: {go_api_url}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User service connection timeout"
        )
    except httpx.ReadTimeout:
        logger.error(f"Read timeout from Go service: {go_api_url}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User service read timeout"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error to Go service: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User authentication service unavailable"
        )
    except ValidationError as e:
        logger.error(f"Invalid profile data from Go API: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid profile data from user service"
        )
    except Exception as e:
        logger.error(f"Unexpected error in user validation: {e}", exc_info=True)
        raise credentials_exception

@asynccontextmanager
async def security_lifespan():
    """Context manager for proper HTTP client lifecycle."""
    try:
        yield
    finally:
        await http_manager.close()