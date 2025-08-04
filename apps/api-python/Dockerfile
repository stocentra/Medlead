# Stage 1: Builder
# --- THE FIX IS HERE ---
# Using the latest stable Python version (3.12) on a full Debian "Bookworm" base image
# for maximum stability during the build process.
FROM python:3.12-bookworm as builder

# Set working directory
WORKDIR /app

# Set environment variables to optimize Python's behavior in Docker
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copy the requirements file first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies into a wheelhouse for portability
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final Image
# Using a slim version for the final image to reduce its size
FROM python:3.12-slim

WORKDIR /app

# Copy the pre-built wheels from the builder stage
COPY --from=builder /app/wheels /app/wheels

# Copy the application source code
COPY ./app ./app

# Install the dependencies from the local wheelhouse without reaching the network
RUN pip install --no-index --find-links=/app/wheels /app/wheels/*

# Expose the port the app will run on
EXPOSE 8000

# The command to run the application using Gunicorn as the production server
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]