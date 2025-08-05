# Stage 1: Builder
FROM python:3.12-bookworm as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY apps/api-python/requirements.txt .

# Install dependencies into a wheelhouse for portability
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final Image
FROM python:3.12-slim

WORKDIR /app

# Ensure SSL certificates are up-to-date, which can help with HTTPS requests.
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/wheels /app/wheels
COPY apps/api-python/app ./app

# Install dependencies from the local wheelhouse
RUN pip install --no-index --find-links=/app/wheels /app/wheels/*

EXPOSE 8000

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]