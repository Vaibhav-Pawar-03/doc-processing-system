from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# ✅ Get DB URL from Railway environment
DATABASE_URL = os.getenv("DATABASE_URL")

# ⚠️ Safety check (optional but good)
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set")

# ✅ Create engine with SSL (required for Railway)
engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"}
)

# ✅ Session
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# ✅ Base model
Base = declarative_base()
