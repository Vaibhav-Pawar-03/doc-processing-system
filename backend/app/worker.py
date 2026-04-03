from app.db import SessionLocal
from app.models import Document
import time

# Sync worker processing (no RabbitMQ/Celery dependency)

def process_document(doc_id: int):
    print(f"\n[WORKER] 🚀 PROCESSING STARTED: document processing for doc_id={doc_id}")
    db = SessionLocal()

    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            print(f"[WORKER] ❌ Document {doc_id} not found in database!")
            return

        print(f"[WORKER] 📄 Found document: {doc.filename}, current_status={doc.status}")

        # Change to parsing
        doc.status = "parsing"
        db.commit()
        print(f"[WORKER] ✏️ Database updated: status → 'parsing'")
        time.sleep(2)

        # Change to extracting
        doc.status = "extracting"
        db.commit()
        print(f"[WORKER] ✏️ Database updated: status → 'extracting'")
        time.sleep(2)

        # Change to completed
        doc.status = "completed"
        db.commit()
        print(f"[WORKER] ✏️ Database updated: status → 'completed'")

        print(f"[WORKER] ✅ PROCESSING COMPLETED: document {doc_id} processing finished\n")

    except Exception as e:
        print(f"[WORKER] ❌ ERROR: {e}")
    finally:
        db.close()