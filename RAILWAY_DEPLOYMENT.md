# Railway Deployment Guide - Bug Fixes & Setup

## 🐛 Bugs Found & Fixed

### 1. **Upload Function Error** ❌ FIXED
**Problem:**
```python
# OLD (BROKEN) - Line 132-133
process_document(doc.id)  # ← Wrong! Calls function directly
print(f"...task.id={task.id}...")  # ← task is undefined!
```

**Fix:**
```python
# NEW (CORRECT)
task = process_document.delay(doc.id)  # ✅ Queue async Celery task
print(f"...task.id={task.id}...")  # ✅ task is now defined
```

**Why:** `process_document` is a Celery task. It must be called with `.delay()` to queue it asynchronously. Direct function calls don't return a task object.

---

### 2. **Hardcoded URLs** ❌ FIXED
**Problem:**
```python
# OLD (BROKEN)
"file_url": f"http://localhost:8000/uploads/{file.filename}"  # ← localhost doesn't work on Railway
"http://backend:8000/notify"  # ← Docker network URL doesn't work on Railway
"redis://redis:6379/0"  # ← Local Docker Redis doesn't work on Railway
```

**Fix:**
```python
# NEW (CORRECT) - Using Environment Variables
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

"file_url": f"{BACKEND_URL}/uploads/{file.filename}"  # ✅ Dynamic URL
f"{BACKEND_URL}/notify"  # ✅ Configurable
broker=REDIS_URL  # ✅ From environment
```

**Why:** Railway gives you a public domain. We need to use environment variables to configure URLs dynamically.

---

### 3. **Worker Broker Configuration** ❌ FIXED
**Problem:**
```python
# OLD - Hardcoded to Docker internal network
celery = Celery("worker", broker="redis://redis:6379/0")
```

**Fix:**
```python
# NEW - Uses environment variable
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
celery = Celery("worker", broker=REDIS_URL)
```

---

## 📋 Setup Instructions

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Sign up / Log in
3. Create new project
4. Click "Provision PostgreSQL"
5. Click "Provision Redis"

### Step 2: Get Connection Strings

From Railway Dashboard for each service:

**PostgreSQL:**
- Click the PostgreSQL service
- Copy the connection string for `DATABASE_URL`

**Redis:**
- Click the Redis service  
- Copy the connection string for `REDIS_URL`

### Step 3: Deploy Backend

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Clone/cd to your project
cd backend

# Link to Railway
railway link

# Set environment variables
railway variables set DATABASE_URL="<paste postgresql url>"
railway variables set REDIS_URL="<paste redis url>"
railway variables set BACKEND_URL="<your railway domain>"
railway variables set ENVIRONMENT="production"

# Deploy
git push
```

Or deploy via GitHub:
1. Go to Railway
2. New Project → GitHub Repo → Select backend repo
3. Environment variables will be set automatically

### Step 4: Get Your Backend URL

From Railway Dashboard:
- Backend service → Deployments
- Get the public URL (e.g., `https://doc-processing-backend-prod.railway.app`)

Copy this URL for the frontend configuration.

### Step 5: Deploy Frontend to Vercel

```bash
# Update .env with Railway backend URL
NEXT_PUBLIC_API_URL=https://your-railway-backend.app
NEXT_PUBLIC_WS_URL=wss://your-railway-backend.app

# Deploy to Vercel
npm run build
vercel deploy
```

---

## ✅ Testing Deployment

### Test 1: Health Check
```bash
curl https://your-railway-backend.app/
# Response: {"status":"ok"}
```

### Test 2: Upload File
```bash
curl -X POST https://your-railway-backend.app/upload \
  -F "file=@test.pdf"

# Response should include:
# {"id": 1, "status": "queued", "task_id": "..."}
```

### Test 3: Check Status
```bash
curl https://your-railway-backend.app/status/1

# Should progress through:
# {"status": "queued"}
# {"status": "parsing"}
# {"status": "extracting"}
# {"status": "completed"}
```

### Test 4: Frontend Integration
1. Open https://your-vercel-frontend.app
2. Upload a file
3. Watch progress bar: 20% → 50% → 80% → 100%
4. Check dashboard

---

## 🔧 Environment Variables Reference

### Backend (Railway)
```
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://user:pass@host:port
BACKEND_URL=https://your-backend.railway.app
ENVIRONMENT=production
PYTHON_VERSION=3.10
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

---

## 🐛 Common Issues & Fixes

### Issue: "Upload fails with 500 error"
**Check:** Backend logs in Railway
```
Railway Dashboard → Backend → Logs
```
Look for error messages. Common causes:
- Database not connected
- REDIS_URL not set
- Permission denied on uploads

### Issue: "Status stays at queued"
**Check:** Worker is running
```
Railway Dashboard → Logs → Search for "[CELERY]"
```
Should see worker processing messages.

### Issue: "WebSocket connection failed"
**Check:** `NEXT_PUBLIC_WS_URL` is correct
- Must use `wss://` for secure WebSocket
- Must match backend domain

### Issue: "CORS error"
**Check:** Backend allows frontend origin
- Update `ALLOWED_ORIGINS` in backend config
- Or set to `"*"` for testing

---

## 📚 Files Created for Railway

1. **backend/railway.toml** - Railway deployment config
2. **backend/.env.railway** - Railway environment template
3. **frontend/.env.railway** - Frontend environment template

---

## 🎯 Next Steps

1. ✅ Push fixed code to GitHub
2. ✅ Deploy backend to Railway
3. ✅ Get backend URL
4. ✅ Update frontend URL
5. ✅ Deploy frontend
6. ✅ Test end-to-end
7. ✅ Monitor logs

Your application is now **bug-fixed and Railway-ready**! 🚀
