# Stage 1: Builder
# Use a full Python image to build wheels, which can include compiling C extensions.
FROM python:3.11-slim as builder

# Set working directory
WORKDIR /app

# Set environment variables to prevent writing .pyc files and to run in unbuffered mode
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copy the requirements file
COPY requirements.txt .

# Install dependencies into a wheelhouse
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final Image
# Use a slim image for a smaller final container size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy the pre-built wheels from the builder stage
COPY --from=builder /app/wheels /app/wheels

# Copy the application source code
COPY ./app ./app

# Install the dependencies from the local wheelhouse
RUN pip install --no-index --find-links=/app/wheels /app/wheels/*

# Expose the port the app will run on
EXPOSE 8000

# The command to run the application using Gunicorn as the production server
# -k: The type of worker class to use (Uvicorn for ASGI)
# -w: The number of worker processes (a common starting point is 2-4)
# -b: The address and port to bind to
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]