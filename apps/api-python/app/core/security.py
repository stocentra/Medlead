import logging 
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import create_client, Client, ClientOptions
from pydantic import ValidationError
import httpx
import ssl
import certifi

from app.core.config import settings
from app.models.schemas import UserProfile

# Create a logger instance for this specific file.
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Create a secure SSL context using certifi's certificate bundle.
ssl_context = ssl.create_default_context(cafile=certifi.where())

# Create a custom httpx client with the secure SSL context and a longer timeout.
httpx_client = httpx.Client(
    timeout=20.0,
    verify=ssl_context # Use the certifi SSL context
)

# Pass the custom client to Supabase via ClientOptions
supabase_options = ClientOptions(
    httpx_client=httpx_client
)
supabase_admin: Client = create_client(
    settings.SUPABASE_URL, 
    settings.SUPABASE_SERVICE_ROLE_KEY,
    options=supabase_options
)

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserProfile:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        user_response = supabase_admin.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise credentials_exception
        
        user_id = user_response.user.id

        response = supabase_admin.from_("profiles").select(
            "id,full_name,professional_level,country,system_role,specialties(name)"
        ).eq("id", user_id).single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Please complete registration."
            )

        profile_data = response.data
        specialty_info = profile_data.pop('specialties', None)
        profile_data['specialty_name'] = specialty_info['name'] if specialty_info else "Not Specified"

        user_profile = UserProfile(**profile_data)

    except Exception as e:
        # This will now reliably appear in the Koyeb logs.
        logger.error(f"Failed to validate token or fetch profile. Root cause: {e}", exc_info=True)
        raise credentials_exception
    
    return user_profile