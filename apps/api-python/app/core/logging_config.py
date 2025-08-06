import logging
import sys
from datetime import datetime

def setup_logging():
    """
    Configures the logging system for the entire application.
    Sets up both console and structured logging.
    """
    
    # Create a custom formatter
    class CustomFormatter(logging.Formatter):
        """Custom formatter that includes timestamp and service info"""
        
        def format(self, record):
            # Add timestamp
            record.timestamp = datetime.utcnow().isoformat() + 'Z'
            
            # Add service identifier
            record.service = 'medlead-ai-core'
            
            # Format the message
            if record.levelname == 'ERROR':
                format_string = '[{timestamp}] [{service}] ERROR: {message} (in {pathname}:{lineno})'
            elif record.levelname == 'CRITICAL':
                format_string = '[{timestamp}] [{service}] CRITICAL: {message} (in {pathname}:{lineno})'
            else:
                format_string = '[{timestamp}] [{service}] {levelname}: {message}'
            
            return format_string.format(
                timestamp=record.timestamp,
                service=record.service,
                levelname=record.levelname,
                message=record.getMessage(),
                pathname=record.pathname,
                lineno=record.lineno
            )
    
    # Configure the root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(CustomFormatter())
    
    # Add handler to root logger
    root_logger.addHandler(console_handler)
    
    # Set specific logger levels
    logging.getLogger('uvicorn').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)
    
    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info("MedLead AI Core logging system initialized successfully")
    
    return True