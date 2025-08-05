import logging
import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import ValidationError

from app.core.config import settings
from app.models.schemas import UserProfile

logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserProfile:
    """
    Gets the current user's profile by making a service-to-service call
    to the public Go API endpoint (/v1/users/me).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    
    # Construct the full public URL to the Go service's protected endpoint.
    go_api_url = f"{settings.GO_API_URL}/v1/users/me"
    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        # Make a request to the public Go service domain.
        response = requests.get(go_api_url, headers=headers, timeout=15)
        
        if response.status_code == 401:
            logger.warning(f"Token validation failed by the Go API. URL: {go_api_url}")
            raise credentials_exception
        
        response.raise_for_status()
        
        profile_data = response.json()
        
        if "specialty_name" not in profile_data:
             profile_data['specialty_name'] = "Not Specified"

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
        logger.error(f"An unexpected error occurred during user validation. Error: {e}", exc_info=True)
        raise credentials_exception