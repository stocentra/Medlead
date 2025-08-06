import logging
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError

from app.core.config import settings
from app.schemas import UserProfile

# Initialize a logger for this module
logger = logging.getLogger(__name__)

# This tells FastAPI's documentation UI how to handle authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token") # "token" is a placeholder

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserProfile:
    """
    Validates the JWT token by making a service-to-service call to the Go API.
    If the token is valid, it returns the full user profile.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    go_api_url = f"{settings.GO_API_URL}/v1/users/me"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        # Make a request to the go-api service to validate the token and get the profile
        response = requests.get(go_api_url, headers=headers, timeout=10)
        
        # If the Go service returns a 401, the token is invalid
        if response.status_code == 401:
            logger.warning("Token validation failed by the Go API.")
            raise credentials_exception
        
        # Raise an exception for other HTTP errors (like 500 from the Go service)
        response.raise_for_status()
        
        profile_data = response.json()
        
        # Use Pydantic to parse the JSON data into our UserProfile model
        user_profile = UserProfile(**profile_data)
        return user_profile

    except requests.RequestException as e:
        logger.error(f"Failed to connect to the Go service at {go_api_url}. Error: {e}")
        raise HTTPException(status_code=503, detail="The user authentication service is currently unavailable.")
    except (ValidationError, KeyError) as e:
        profile_text = response.text if 'response' in locals() else "No response text"
        logger.error(f"Failed to parse profile from Go API. Error: {e}. Data: {profile_text}")
        raise HTTPException(status_code=500, detail="Invalid profile data received from user service.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during user validation: {e}", exc_info=True)
        raise credentials_exception