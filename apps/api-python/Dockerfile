# Stage 1: Builder
FROM python:3.12-bookworm as builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY apps/api-python/requirements.txt .

# Install dependencies into a wheelhouse for portability
RUN pip wheel --no-cache-dir --wheel-dir /build/wheels -r requirements.txt

# Stage 2: Final Image
FROM python:3.12-slim

WORKDIR /app

# Ensure SSL certificates are up-to-date
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder stage
COPY --from=builder /build/wheels /tmp/wheels

# Install dependencies from wheels
RUN pip install --no-index --find-links=/tmp/wheels /tmp/wheels/* && rm -rf /tmp/wheels

# Copy the entire api-python directory structure to maintain app/ structure
COPY apps/api-python/ .

EXPOSE 8000

# Now gunicorn can find app.main:app correctly
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "2", "-b", "0.0.0.0:8000", "--timeout", "120", "--keep-alive", "5", "app.main:app"]