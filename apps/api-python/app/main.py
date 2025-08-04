from fastapi import FastAPI
from app.routes import chat
from app.core.logging_config import setup_logging # Import the setup function

# --- THE FIX IS HERE ---
# Set up logging as the very first thing when the application starts.
setup_logging()
# --- END OF FIX ---

app = FastAPI(
    title="MedLead AI Core Service",
    description="This service handles the core AI logic...",
    version="1.0.0"
)

app.include_router(chat.router, prefix="/api/v1")

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "description": "AI Core service is healthy"}