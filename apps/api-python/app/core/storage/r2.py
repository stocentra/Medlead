# In: app/core/storage/r2.py
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any
import s3fs
import aiofiles

logger = logging.getLogger(__name__)

class R2Uploader:
    """
    Handles uploading training data to a Cloudflare R2 bucket.
    """
    def __init__(self, endpoint_url: str, access_key_id: str, secret_access_key: str, bucket_name: str):
        if not all([endpoint_url, access_key_id, secret_access_key, bucket_name]):
            logger.warning("R2 storage is not configured. Data flywheel is disabled.")
            self.fs = None
            self.bucket_name = None
            return

        try:
            self.fs = s3fs.S3FileSystem(
                key=access_key_id,
                secret=secret_access_key,
                endpoint_url=endpoint_url,
                config_kwargs={'s3': {'addressing_style': 'path'}}
            )
            self.bucket_name = bucket_name
            logger.info(f"Successfully connected to R2 bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize R2 Uploader: {e}", exc_info=True)
            self.fs = None
            self.bucket_name = None

    async def upload_training_data(self, data: Dict[str, Any]):
        """
        Asynchronously uploads a single training record to R2 as a JSONL entry.
        """
        if not self.fs or not self.bucket_name:
            logger.warning("Skipping training data upload because R2 is not configured.")
            return

        try:
            # Create a unique filename based on date and user ID
            user_id = data.get("user_id", "unknown_user")
            today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
            file_path = f"{self.bucket_name}/{today}/{user_id}.jsonl"

            # Convert the dictionary to a JSON string (a single line in the JSONL file)
            json_line = json.dumps(data) + "\n"

            # Use s3fs for async write operation
            async with self.fs.open(file_path, 'a') as f:
                 await f.write(json_line)
            
            logger.info(f"Successfully appended training data to {file_path}")

        except Exception as e:
            logger.error(f"Failed to upload training data to R2: {e}", exc_info=True)

# Singleton instance to be created at app startup
uploader: R2Uploader = None

def get_uploader() -> R2Uploader:
    """Dependency injector for the R2Uploader."""
    return uploader