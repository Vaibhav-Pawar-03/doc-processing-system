from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 🔥 PostgreSQL connection
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@postgres:5432/docs_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()