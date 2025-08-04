from fastapi import FastAPI
from app.routes import chat

app = FastAPI(
    title="MedLead AI Core Service",
    description="This service handles the core AI logic, including prompt engineering and communication with Google Gemini.",
    version="1.0.0"
)

app.include_router(chat.router, prefix="/api/v1")

@app.get("/health", tags=["Health Check"])
def health_check():
    """
    A simple health check endpoint to confirm the service is running.
    """
    return {"status": "ok", "description": "AI Core service is healthy"}