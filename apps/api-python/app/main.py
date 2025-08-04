from fastapi import FastAPI
from .routes import chat # Import the chat router

# Create the main FastAPI application instance
app = FastAPI(
    title="Medlead AI Core API",
    description="The core AI service for the Medlead clinical assistant.",
    version="1.0.0"
)

# Include the chat router in the main application
app.include_router(chat.router)

@app.get("/health", tags=["Health Check"])
async def health_check():
    """
    A simple health check endpoint to confirm the service is running.
    """
    return {"status": "ok", "description": "AI service is up and running"}