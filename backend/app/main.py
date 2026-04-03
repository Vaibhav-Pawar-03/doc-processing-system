import os
import asyncio
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request
from app.db import Base, engine, SessionLocal
from app.models import Document
from app.worker import process_document

# 🔥 Environment Configuration for Railway
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
RAILWAY_DOMAIN = os.getenv("RAILWAY_DOMAIN", "http://localhost:8000")
BACKEND_URL = os.getenv("BACKEND_URL", RAILWAY_DOMAIN)

# 🔥 App init
app = FastAPI()

@app.get("/")
async def health():
    return {"status": "ok"}
    
# 🔥 WebSocket manager (FIXED)
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except RuntimeError:
                disconnected.append(connection)

        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

manager = ConnectionManager()

# 🔥 WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    print("✅ WebSocket connected")

    try:
        while True:
            await asyncio.sleep(10)  # 🔥 keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("❌ WebSocket disconnected")

# 🔥 Notify API
@app.post("/notify")
async def notify(data: dict):
    await manager.broadcast(data)
    print("📡 Sent to frontend:", data)
    return {"status": "sent"}

# 🔥 Upload config
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 🔥 Security config
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_TYPES = ["pdf", "docx"]

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

Base.metadata.create_all(bind=engine)

# 🔥 CORS
origins = [
    "http://localhost:3000",
    "https://doc-processing-system.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 🔥 APIs
@app.get("/documents")
def get_documents():
    db = SessionLocal()
    try:
        docs = db.query(Document).all()
        return [{"id": d.id, "filename": d.filename, "status": d.status} for d in docs]
    finally:
        db.close()

@app.get("/status/{doc_id}")
def get_status(doc_id: int):
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            print(f"[API] ❌ STATUS QUERY: doc_id={doc_id} not found!")
            return {"error": "Not found"}
        
        print(f"[API] 📊 STATUS QUERY: doc_id={doc_id} → status={doc.status}")
        return {"id": doc.id, "status": doc.status}
    finally:
        db.close()

# 🔥 Upload
@app.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    # 🔥 Security checks
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 5MB allowed.")
    
    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files allowed.")
    
    db = SessionLocal()
    print(f"\n📥 [BACKEND] Upload request for file: {file.filename}")
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        print(f"💾 [BACKEND] File saved to: {file_path}")

        doc = Document(filename=file.filename, status="queued")
        db.add(doc)
        db.commit()
        db.refresh(doc)
        print(f"📊 [BACKEND] Document created in DB with id={doc.id}, status={doc.status}")

        print(f"🔄 [BACKEND] Processing document synchronously for doc {doc.id}")
        # Process synchronously
        process_document(doc.id)
        print(f"✅ [BACKEND] Document processed synchronously for doc {doc.id}\n")

        base_url = str(request.base_url).rstrip("/")
        return {
            "success": True,
            "data": {
                "id": doc.id,
                "filename": file.filename,
                "file_url": f"{base_url}/uploads/{file.filename}",
                "status": "completed"
            },
            "message": "File uploaded and processed successfully"
        }
    except Exception as e:
        print(f"❌ [BACKEND] Upload error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
