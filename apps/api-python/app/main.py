# In: app/main.py

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse # <-- ADDED
from pathlib import Path                 # <-- ADDED

from app.routes import chat
from app.core.logging_config import setup_logging
from app.core.config import settings
from app.core.storage.r2 import R2Uploader
from app.core.security import http_manager
import app.core.storage.r2 as storage_module

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Optimized lifespan management for high-concurrency deployment.
    """
    # --- Startup ---
    setup_logging()
    
    # Initialize R2 uploader
    storage_module.uploader = R2Uploader(
        endpoint_url=settings.R2_ENDPOINT_URL,
        access_key_id=settings.R2_ACCESS_KEY_ID,
        secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        bucket_name=settings.R2_TRAINING_BUCKET_NAME,
    )
    
    # Pre-warm HTTP client
    await http_manager.get_client()
    
    yield
    
    # --- Shutdown ---
    # Properly close HTTP connections
    await http_manager.close()

# Create FastAPI app with optimized settings for high concurrency
app = FastAPI(
    title="MedLead AI Core Service",
    description="High-performance AI service optimized for 1000+ concurrent users",
    version="2.0.0",
    lifespan=lifespan,
    # Performance optimizations
    docs_url="/docs" if settings.DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Add performance middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware with optimized settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,  # Cache preflight requests
)

# Include routes
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])


# --- ADDED: Root endpoint to serve the HTML landing page ---
# Get the path to the static directory relative to this file
static_dir = Path(__file__).parent / "static"
index_file_path = static_dir / "index.html"

@app.get("/", include_in_schema=False)
async def read_root():
    """Serves the static landing page for the root URL."""
    if index_file_path.is_file():
        return FileResponse(index_file_path)
    return {"message": "Welcome to MedLead AI Core Service. Landing page not found."}
# --- END OF ADDED SECTION ---


@app.get("/health", tags=["Health Check"])
async def health_check():
    """
    Optimized health check with minimal resource usage.
    """
    return {"status": "ok", "service": "ai-core", "concurrent_users": "1000+"}

@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    # In a real-world scenario, this would integrate with a monitoring tool like Prometheus
    # For now, it returns basic information.
    # This is a placeholder for future implementation.
    return {
        "active_connections": "N/A",
        "requests_per_minute": "N/A",
        "error_rate": "N/A"
    }