# 🔧 Fixed: $PORT Environment Variable Issue

## ❌ Problem
```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```

## 🎯 Root Cause
Railway sets a `$PORT` environment variable for deployment, but:
- TOML format doesn't expand shell variables like `$PORT`
- uvicorn was receiving the literal string `"$PORT"` instead of the actual port number
- This is different from `docker-compose.yml` which uses `sh -c` to expand variables

## ✅ Solution Implemented

### 1. **Created `backend/start.sh`** - Shell startup script
```bash
#!/bin/sh
echo "🚀 Starting Document Processing Backend..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
```

**Why:** Shell script properly expands `${PORT}` environment variable

### 2. **Updated `backend/railway.toml`** - Use startup script
```toml
[deploy]
startCommand = "sh start.sh"
```

**Why:** Railway will execute the shell script, which expands variables

### 3. **Fixed `frontend/src/app/page.tsx`** - Use environment variables
```javascript
// ❌ OLD - Hardcoded URL
const API_BASE_URL = "https://doc-processing-system-production.up.railway.app";

// ✅ NEW - Environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
```

**Why:** Allows different URLs for different environments (local, staging, production)

### 4. **Updated `backend/.env.railway`** - Added documentation
```
# $PORT is automatically set by Railway (no need to add it)
```

---

## 📊 Comparison

| Approach | Works Locally | Works Railway | Issue |
|----------|--------------|---------------|-------|
| Direct in TOML | ❌ | ❌ | Variables not expanded |
| Shell script | ✅ | ✅ | Properly expands `$PORT` |
| Hardcoded URLs | ✅ | ✅ | Can't change URLs per env |
| Environment vars | ✅ | ✅ | Flexible, scalable |

---

## ✅ Verification

After deploying to Railway:

1. **Check logs** - Should see:
   ```
   🚀 Starting Document Processing Backend...
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

2. **Test endpoint**:
   ```bash
   curl https://your-backend.railway.app/
   # Response: {"status":"ok"}
   ```

3. **Check PORT value** - Railway automatically injects `$PORT`

---

## 🚀 Deploy Now

### On Railway Dashboard:

1. Backend service → Settings
2. Trigger new deployment (or push to GitHub)
3. Monitor logs - should show proper startup
4. Get public URL

### Set Frontend URL:

```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

---

## 📝 Files Changed

- ✅ `backend/start.sh` - NEW startup script
- ✅ `backend/railway.toml` - Updated to use script
- ✅ `backend/.env.railway` - Added documentation
- ✅ `frontend/src/app/page.tsx` - Use environment variables
- ✅ Pushed to GitHub ✓

---

## 🎯 Key Lesson

**TOML doesn't expand shell variables. Use a shell script instead!**

```toml
# ❌ DON'T
startCommand = "uvicorn app.main:app --port $PORT"

# ✅ DO
startCommand = "sh start.sh"
```

Where `start.sh` properly handles variable expansion.

---

**Your Railway deployment should now work without port errors!** 🎉
