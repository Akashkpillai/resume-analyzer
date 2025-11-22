# Quick Start: Deploy to Render (Node.js Service)

## Quick Setup Steps

### 1. Create PostgreSQL Database on Render
1. Render Dashboard → "New +" → "PostgreSQL"
2. Name it (e.g., `resume-analyzer-db`)
3. Copy the **Internal Database URL**

### 2. Deploy Backend Service

**Option A: Using Blueprint (Easiest)**
1. Render Dashboard → "New +" → "Blueprint"
2. Connect your GitHub repo
3. Render will auto-detect `backend/render.yaml`
4. Click "Apply"

**Option B: Manual Setup**
1. Render Dashboard → "New +" → "Web Service"
2. Connect GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

### 3. Set Environment Variables

In your service → "Environment" tab, add:

```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=your-strong-random-secret-min-32-chars
GROQ_API_KEY=gsk_your_groq_api_key_here
NODE_ENV=production
```

### 4. Run Migrations

After first deployment:
1. Go to your service → "Shell" tab
2. Run: `npx prisma migrate deploy`

### 5. Done! 🎉

Your backend will be available at: `https://your-service-name.onrender.com`

**Test it:**
- API: `https://your-service-name.onrender.com`
- Swagger: `https://your-service-name.onrender.com/api`

---

## Important Notes

- ✅ Prisma Client generates automatically (via `postinstall` script)
- ✅ PORT is set automatically by Render
- ⚠️ Free tier spins down after 15 min inactivity
- ⚠️ File uploads are ephemeral (consider cloud storage)

## Update Frontend

Change your frontend API URL to:
```javascript
const API_URL = 'https://your-service-name.onrender.com';
```

