from fastapi import FastAPI, Response
from app.routes import chat
from app.core.logging_config import setup_logging
from app.core.config import settings # Import settings
import socket # Import the socket library for DNS lookup
import requests # Import requests for connectivity test
import json

setup_logging()

app = FastAPI(
    title="MedLead AI Core Service",
    description="This service handles the core AI logic...",
    version="1.0.0"
)

app.include_router(chat.router, prefix="/api/v1")

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok", "description": "AI Core service is healthy"}

# --- NEW DEBUG ENDPOINT ---
@app.get("/debug-network", tags=["Debugging"])
def debug_network():
    """
    This endpoint tests network connectivity and DNS resolution from inside the container.
    """
    supabase_host = "bppdzlkycgaoxlsfzfiz.supabase.co"
    results = {
        "supabase_url_from_env": settings.SUPABASE_URL,
        "dns_lookup_for_supabase": {},
        "connectivity_to_google": {}
    }

    # 1. Test DNS resolution for Supabase
    try:
        ip_address = socket.gethostbyname(supabase_host)
        results["dns_lookup_for_supabase"] = {
            "status": "Success",
            "host": supabase_host,
            "resolved_ip": ip_address
        }
    except Exception as e:
        results["dns_lookup_for_supabase"] = {
            "status": "Failed",
            "host": supabase_host,
            "error": str(e)
        }

    # 2. Test general internet connectivity to a reliable source
    try:
        response = requests.get("https://www.google.com", timeout=10)
        results["connectivity_to_google"] = {
            "status": "Success",
            "http_status_code": response.status_code
        }
    except Exception as e:
        results["connectivity_to_google"] = {
            "status": "Failed",
            "error": str(e)
        }

    return Response(content=json.dumps(results, indent=2), media_type="application/json")
# --- END OF DEBUG ENDPOINT ---