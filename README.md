# Document Processing System

## � Project Overview
A full-stack document processing application that allows users to upload PDF and DOCX files, process them asynchronously, and track progress in real-time via WebSocket. Built for production deployment with environment variable configuration.

## 🚀 Tech Stack
- **Frontend**: Next.js 16.2.1, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python 3.10), Uvicorn
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Real-time**: WebSocket for status updates
- **Deployment**: Railway (backend), Vercel/Netlify (frontend)
- **Containerization**: Docker & Docker Compose

## ⚡ Features
- ✅ File upload (PDF, DOCX)
- ✅ Synchronous document processing
- ✅ Real-time status tracking via WebSocket
- ✅ File download after processing
- ✅ Responsive UI with loading states
- ✅ Environment variable configuration
- ✅ CORS enabled for cross-origin requests
- ✅ Production-ready with Railway deployment

## 🛠 Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Git

### Backend Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd doc_processing_system

# Start backend services (PostgreSQL, Redis)
docker-compose up -d

# Install Python dependencies (if running without Docker)
cd backend
pip install -r requirements.txt

# Run backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` for the frontend.

## 🌐 Production Deployment

### Backend (Railway)
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard:
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection string (if using async)
   - `ENVIRONMENT`: `production`
   - `BACKEND_URL`: Your Railway backend URL
3. Deploy automatically on push

### Frontend (Vercel/Netlify)
1. Connect your GitHub repo
2. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://your-app.railway.app`)
   - `NEXT_PUBLIC_WS_URL`: WebSocket URL (e.g., `wss://your-app.railway.app`)
3. Deploy

## 🔗 Live Links
- **Frontend**: [Deployed on Vercel/Netlify]
- **Backend API**: [Deployed on Railway]
- **API Docs**: `/docs` (Swagger UI)

## 📁 Project Structure
```
doc_processing_system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app & routes
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── db.py            # Database configuration
│   │   ├── schemas.py       # Pydantic schemas
│   │   └── worker.py        # Document processing logic
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx     # Main upload page
│   │       └── layout.tsx   # App layout
│   ├── package.json
│   └── next.config.ts
├── docker-compose.yml        # Local development
└── README.md
```

## 🔧 API Endpoints
- `GET /` - Health check
- `POST /upload` - Upload file
- `GET /documents` - List documents
- `GET /status/{doc_id}` - Get document status
- `WebSocket /ws` - Real-time status updates
- `POST /notify` - Send status notifications

## 🐛 Troubleshooting
- Ensure all environment variables are set
- Check Railway logs for backend issues
- Use browser dev tools for frontend debugging
- Verify CORS settings for cross-origin requests

## 📝 Notes
- Files are currently stored locally (container). For production, consider cloud storage (AWS S3, Cloudinary)
- Processing is synchronous; for heavy loads, implement async queue (Celery + Redis)
- Add authentication for production use
