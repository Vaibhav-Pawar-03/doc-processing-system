from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# 🔥 Environment-aware database configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DATABASE_URL = os.getenv("DATABASE_URL")

# For local Docker development, use docker-compose network
if not DATABASE_URL:
    if ENVIRONMENT == "development":
        DATABASE_URL = "postgresql://postgres:postgres@postgres:5432/docs_db"
    else:
        raise ValueError("DATABASE_URL is required for production")

print(f"[DB] Environment: {ENVIRONMENT}")
print(f"[DB] Connecting to database...")

# 🔥 Create engine with appropriate SSL settings
if ENVIRONMENT == "production":
    # Railway requires SSL
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"}
    )
else:
    # Local development doesn't need SSL
    engine = create_engine(DATABASE_URL)

print(f"[DB] ✅ Database engine created")

# 🔥 Session
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# 🔥 Base model
Base = declarative_base()

