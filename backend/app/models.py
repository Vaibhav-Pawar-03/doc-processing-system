from sqlalchemy import Column, Integer, String, JSON
from .db import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    status = Column(String, default="queued")
    result = Column(JSON, nullable=True)