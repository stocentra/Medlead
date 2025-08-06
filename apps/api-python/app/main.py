from fastapi import FastAPI
from app.routes import chat
from app.core.logging_config import setup_logging

# --- Application Setup ---

# Configure logging as the first step
setup_logging()

# Create the main FastAPI application instance
app = FastAPI(
    title="MedLead AI Core Service",
    description="This service handles the core AI logic, including prompt engineering and communication with Google Gemini.",
    version="1.0.0"
)

# Include the chat router with a global prefix for all its endpoints
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])

# --- Health Check Endpoint ---

@app.get("/health", tags=["Health Check"])
def health_check():
    """
    A simple health check endpoint to confirm the service is running and healthy.
    This is used by Koyeb to ensure the service is operational.
    """
    return {"status": "ok", "description": "AI Core service is healthy"}