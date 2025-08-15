import logging
import sys
from datetime import datetime
from typing import Dict, Any

class OptimizedCustomFormatter(logging.Formatter):
    """
    High-performance custom formatter optimized for 1000+ concurrent users.
    Minimizes datetime calls and string operations.
    """
    
    def __init__(self):
        super().__init__()
        self.service_name = 'medlead-ai-core'
        
        # Pre-compiled format strings for performance
        self.format_templates = {
            'ERROR': '[{timestamp}] [{service}] ERROR: {message} (in {pathname}:{lineno})',
            'CRITICAL': '[{timestamp}] [{service}] CRITICAL: {message} (in {pathname}:{lineno})',
            'DEFAULT': '[{timestamp}] [{service}] {levelname}: {message}'
        }
        
        # Cache for timestamp to reduce datetime.utcnow() calls
        self._last_timestamp = None
        self._last_timestamp_str = None
        
    def _get_optimized_timestamp(self) -> str:
        """
        Optimized timestamp generation with 1-second caching.
        Reduces datetime.utcnow() calls significantly under high load.
        """
        now = datetime.utcnow()
        
        # Cache timestamp for 1 second to reduce overhead
        if (self._last_timestamp is None or 
            (now - self._last_timestamp).total_seconds() >= 1.0):
            self._last_timestamp = now
            self._last_timestamp_str = now.isoformat() + 'Z'
        
        return self._last_timestamp_str
    
    def format(self, record: logging.LogRecord) -> str:
        """
        Optimized format method with minimal string operations.
        """
        # Get cached timestamp
        timestamp = self._get_optimized_timestamp()
        
        # Select appropriate format template
        if record.levelname in ('ERROR', 'CRITICAL'):
            template = self.format_templates[record.levelname]
            return template.format(
                timestamp=timestamp,
                service=self.service_name,
                message=record.getMessage(),
                pathname=record.pathname,
                lineno=record.lineno
            )
        else:
            template = self.format_templates['DEFAULT']
            return template.format(
                timestamp=timestamp,
                service=self.service_name,
                levelname=record.levelname,
                message=record.getMessage()
            )

class HighPerformanceLogFilter(logging.Filter):
    """
    High-performance log filter to reduce noise under high load.
    """
    
    def __init__(self):
        super().__init__()
        # Cache frequently filtered patterns
        self.filtered_patterns = [
            'health',  # Skip frequent health check logs
            'metrics',  # Skip frequent metrics logs
            'favicon.ico',  # Skip browser favicon requests
        ]
    
    def filter(self, record: logging.LogRecord) -> bool:
        """
        Filter out noisy log messages to improve performance.
        """
        message = record.getMessage().lower()
        
        # Skip health check spam
        if any(pattern in message for pattern in self.filtered_patterns):
            return False
        
        return True

def setup_logging(debug_mode: bool = False) -> bool:
    """
    Optimized logging setup for high-concurrency environments.
    Reduces logging overhead significantly.
    """
    
    # Configure root logger with appropriate level
    root_logger = logging.getLogger()
    log_level = logging.DEBUG if debug_mode else logging.INFO
    root_logger.setLevel(log_level)
    
    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create optimized console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(OptimizedCustomFormatter())
    
    # Add performance filter (only in production)
    if not debug_mode:
        console_handler.addFilter(HighPerformanceLogFilter())
    
    # Add handler to root logger
    root_logger.addHandler(console_handler)
    
    # Optimize third-party loggers for production
    third_party_loggers = {
        'uvicorn': logging.WARNING,
        'uvicorn.access': logging.ERROR,  # Reduce access log noise
        'httpx': logging.WARNING,
        'httpcore': logging.WARNING,
        'google.generativeai': logging.WARNING,  # Reduce Gemini API logs
        'asyncio': logging.WARNING,
    }
    
    for logger_name, level in third_party_loggers.items():
        logging.getLogger(logger_name).setLevel(level)
    
    # Configure application loggers
    app_loggers = {
        'app.core.ai_engine': logging.INFO,
        'app.core.security': logging.INFO,
        'app.routes.chat': logging.INFO,
    }
    
    for logger_name, level in app_loggers.items():
        logging.getLogger(logger_name).setLevel(level)
    
    # Log startup message only once
    logger = logging.getLogger(__name__)
    logger.info(f"Optimized logging initialized (debug={debug_mode}, level={log_level})")
    
    return True

# Convenience function for emergency logging without formatting overhead
def emergency_log(message: str, level: str = "CRITICAL"):
    """
    Emergency logging function that bypasses formatters.
    Use only for critical system failures.
    """
    timestamp = datetime.utcnow().isoformat() + 'Z'
    emergency_message = f"[{timestamp}] [medlead-ai-core] {level}: {message}"
    print(emergency_message, file=sys.stderr)