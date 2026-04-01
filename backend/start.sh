#!/bin/sh
# Railway startup script for Backend

echo "🚀 Starting Document Processing Backend..."
echo "Environment: ${ENVIRONMENT}"
echo "Python: ${PYTHON_VERSION}"
echo "Port: ${PORT:-8000}"

# Start Celery worker in background (if needed for background tasks)
# celery -A app.worker.celery worker --loglevel=info &

# Start FastAPI with uvicorn
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
