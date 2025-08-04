# Stage 1: Builder
FROM python:3.12-bookworm as builder

# Set working directory inside the container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# --- THE FIX IS HERE ---
# Copy the requirements file using its full path from the repository root.
COPY apps/api-python/requirements.txt .

# Install dependencies into a wheelhouse
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final Image
FROM python:3.12-slim

WORKDIR /app

# Copy the pre-built wheels from the builder stage
COPY --from=builder /app/wheels /app/wheels

# --- THE FIX IS HERE ---
# Copy the application source code using its full path from the repository root.
COPY apps/api-python/app ./app

# Install the dependencies from the local wheelhouse
RUN pip install --no-index --find-links=/app/wheels /app/wheels/*

# Expose the port the app will run on
EXPOSE 8000

# The command to run the application using Gunicorn
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]