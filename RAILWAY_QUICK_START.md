# 🚀 Quick Start: Deploy to Railway

## Bugs Fixed ✅
- ✅ Undefined `task` variable - Now uses `.delay()`
- ✅ Hardcoded URLs - Now environment-configurable  
- ✅ Rigid database config - Now works local AND production

## 5-Minute Deploy Checklist

### Before Deploy
```bash
git pull origin main  # Get latest fixes
```

### On Railway Dashboard

**1. Create PostgreSQL**
- New Project → PostgreSQL
- Copy connection string → Save

**2. Create Redis** 
- Go to redis.com (free tier)
- Create database
- Copy connection string → Save

**3. Set Backend Environment Variables**
- Backend Service → Variables
- Add:
  ```
  DATABASE_URL=<PostgreSQL connection>
  REDIS_URL=<Redis connection>
  BACKEND_URL=https://your-backend-domain.railway.app
  ENVIRONMENT=production
  ```

**4. Deploy Backend**
- Connect GitHub repo
- Auto-deploys on push
- Monitor: Deployments tab

### Get Backend URL
```
Railway Dashboard → Backend Service → Settings
Copy Public URL: https://your-service-prod.railway.app
```

### Update Frontend
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

### Deploy Frontend
- Vercel: Connect same GitHub repo
- Auto-deploys when you push

---

## ✅ Test Upload

```bash
curl -X POST https://your-backend.railway.app/upload \
  -F "file=@test.pdf"
```

Should return:
```json
{
  "id": 1,
  "status": "queued",
  "task_id": "..."
}
```

---

## 📚 Full Guides

- `RAILWAY_DEPLOYMENT.md` - Detailed setup guide
- `BUG_FIX_REPORT.md` - Technical bug analysis
- `UPLOAD_ERROR_FIXED.md` - Complete fix summary

---

## 🆘 If Upload Still Fails

1. Check backend logs:
   ```
   Railway Dashboard → Backend → Logs
   Search for: "Upload request"
   ```

2. Verify environment variables:
   ```
   Railway Dashboard → Backend → Variables
   Check: DATABASE_URL, REDIS_URL, BACKEND_URL
   ```

3. Test database connectivity:
   ```
   Railway Dashboard → PostgreSQL → Logs
   Check for connection errors
   ```

4. Test Redis connectivity:
   ```
   redis-cli -h your-redis-host
   PING
   ```

---

**You're ready to deploy! Push code and Railway auto-deploys.** 🎉
