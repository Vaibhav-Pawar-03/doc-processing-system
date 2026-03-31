FROM python:3.10

WORKDIR /app

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# Install netcat for DB wait
RUN apt-get update && apt-get install -y netcat-openbsd

# Create uploads directory with proper permissions
RUN mkdir -p /app/app/uploads && chmod 777 /app/app/uploads
