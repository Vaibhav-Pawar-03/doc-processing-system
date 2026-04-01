from celery import Celery
from app.db import SessionLocal
from app.models import Document
import time
import requests
import os

# 🔥 Environment Configuration for Railway
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

celery = Celery(
    "worker",
    broker=REDIS_URL
)

print(f"[CELERY] ✅ Celery worker initialized with broker: {REDIS_URL}")

def send_update(doc_id: int, status: str):
    try:
        res = requests.post(
            f"{BACKEND_URL}/notify",
            json={"id": doc_id, "status": status},
            timeout=2
        )
        print(f"[CELERY] 📡 Status '{status}' sent to backend → HTTP {res.status_code}")
    except Exception as e:
        print(f"[CELERY] ❌ Notify failed for doc {doc_id}: {e}")

@celery.task
def process_document(doc_id: int):
    print(f"\n[CELERY] 🚀 TASK STARTED: document processing for doc_id={doc_id}")
    db = SessionLocal()

    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            print(f"[CELERY] ❌ Document {doc_id} not found in database!")
            return

        print(f"[CELERY] 📄 Found document: {doc.filename}, current_status={doc.status}")

        # Change to parsing
        doc.status = "parsing"
        db.commit()
        print(f"[CELERY] ✏️ Database updated: status → 'parsing'")
        send_update(doc.id, "parsing")
        time.sleep(2)

        # Change to extracting
        doc.status = "extracting"
        db.commit()
        print(f"[CELERY] ✏️ Database updated: status → 'extracting'")
        send_update(doc.id, "extracting")
        time.sleep(2)

        # Change to completed
        doc.status = "completed"
        db.commit()
        print(f"[CELERY] ✏️ Database updated: status → 'completed'")
        send_update(doc.id, "completed")

        print(f"[CELERY] ✅ TASK COMPLETED: document {doc_id} processing finished\n")

    except Exception as e:
        print(f"[CELERY] ❌ ERROR: {e}")
    finally:
        db.close()