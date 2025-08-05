import os
import socket
import requests
import logging
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """
    Loads configuration from environment variables and applies DNS fallbacks.
    """
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    GEMINI_API_KEYS: List[str] = []
    MODEL_PERSONA: str
    SYSTEM_PREAMBLE: str

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = 'ignore'

    def __init__(self, **values):
        super().__init__(**values)
        
        # Load Gemini API keys
        i = 1
        while True:
            key = os.getenv(f"GEMINI_API_KEY_{i}")
            if key:
                self.GEMINI_API_KEYS.append(key)
                i += 1
            else:
                break
        
        if not self.GEMINI_API_KEYS:
            raise ValueError("No GEMINI_API_KEY_n variables found in the environment.")
        
        # Apply DNS fix for Supabase URL if needed
        self._apply_dns_fallback()

    def _resolve_via_doh(self, hostname: str) -> Optional[str]:
        """Resolves hostname using public DNS-over-HTTPS providers."""
        providers = [
            'https://cloudflare-dns.com/dns-query',
            'https://dns.google/resolve'
        ]
        for provider in providers:
            try:
                response = requests.get(
                    provider,
                    headers={'accept': 'application/dns-json'},
                    params={'name': hostname, 'type': 'A'},
                    timeout=5
                )
                response.raise_for_status()
                data = response.json()
                if data.get('Answer'):
                    for answer in data['Answer']:
                        if answer.get('type') == 1: # A record
                            ip = answer['data']
                            logger.info(f"Successfully resolved {hostname} to {ip} via {provider}")
                            return ip
            except requests.RequestException as e:
                logger.warning(f"DoH resolution with {provider} failed: {e}")
                continue
        return None

    def _apply_dns_fallback(self):
        """Applies DNS fallback if direct resolution fails."""
        try:
            # Extract hostname from the full URL
            hostname = self.SUPABASE_URL.split('//')[1].split('/')[0]
        except IndexError:
            logger.error(f"Could not parse hostname from SUPABASE_URL: {self.SUPABASE_URL}")
            return

        try:
            # First, try the standard system DNS resolver
            socket.gethostbyname(hostname)
            logger.info(f"Standard DNS resolution successful for {hostname}. No fallback needed.")
            return
        except socket.gaierror:
            logger.warning(f"Standard DNS resolution for {hostname} failed. Attempting DNS-over-HTTPS fallback.")
            
            # If standard DNS fails, try DNS-over-HTTPS
            ip_address = self._resolve_via_doh(hostname)
            
            if ip_address:
                original_url = self.SUPABASE_URL
                self.SUPABASE_URL = original_url.replace(hostname, ip_address)
                logger.info(f"Applied DNS fallback. Supabase URL is now: {self.SUPABASE_URL}")
            else:
                logger.error(f"All DNS fallback methods failed for {hostname}. The application might fail to connect to Supabase.")

# Create a single instance of the settings
settings = Settings()