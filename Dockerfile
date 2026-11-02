# Universal Dockerfile para Backend ERP
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema para PostgreSQL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

COPY backend/ ./backend/

ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "python -m backend.app.seed && python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT"]
