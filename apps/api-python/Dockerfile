# Stage 1: Builder
FROM python:3.12-bookworm as builder

# --- THE FIX IS HERE ---
# Set reliable public DNS servers for the build stage to ensure dependencies can be downloaded.
# This prevents failures caused by the host's default DNS resolver.
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 1.1.1.1" >> /etc/resolv.conf

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY apps/api-python/requirements.txt .

RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt


# Stage 2: Final Image
FROM python:3.12-slim

# --- THE FIX IS HERE ---
# Apply the same reliable DNS configuration to the final running container.
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 1.1.1.1" >> /etc/resolv.conf

WORKDIR /app

COPY --from=builder /app/wheels /app/wheels
COPY apps/api-python/app ./app
RUN pip install --no-index --find-links=/app/wheels /app/wheels/*

EXPOSE 8000

CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "app.main:app"]