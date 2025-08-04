import logging
import sys

def setup_logging():
    """
    Configures the root logger to output structured logs to standard output.
    This is the standard practice for containerized applications.
    """
    # Get the root logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO) # Set the minimum level of logs to capture

    # Remove any existing handlers to avoid duplicate logs
    if logger.hasHandlers():
        logger.handlers.clear()

    # Create a handler to write logs to standard output (what Koyeb reads)
    handler = logging.StreamHandler(sys.stdout)
    
    # Create a formatter to define the log message format
    formatter = logging.Formatter(
        '%(asctime)s - [%(levelname)s] - [%(name)s] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)

    # Add the handler to the logger
    logger.addHandler(handler)