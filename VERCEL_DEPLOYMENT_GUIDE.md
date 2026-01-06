# Adelphe Connect - Vercel Deployment Guide

## Overview
This guide will help you deploy the Adelphe Connect web app to Vercel with your custom domain.

## Prerequisites
1. A Vercel account (free at vercel.com)
2. Your custom domain
3. A deployed backend API (see Backend Deployment section)

---

## Step 1: Deploy Backend First

Before deploying the frontend, you need your backend API running. Options:

### Option A: Railway (Recommended - Easy)
1. Go to railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo" or upload the `/backend` folder
4. Railway will auto-detect Python/FastAPI
5. Add environment variable: `MONGO_URL` (your MongoDB connection string)
6. Note your backend URL (e.g., `https://adelphe-api.up.railway.app`)

### Option B: Render.com
1. Go to render.com
2. Create a new "Web Service"
3. Connect your repo or upload backend code
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `MONGO_URL`

### Option C: Vercel Serverless (Advanced)
- Convert FastAPI to serverless functions
- More complex setup required

---

## Step 2: Prepare Frontend for Deployment

### Update Backend URL

1. Edit `/frontend/.env.production`:
```
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

2. Edit `/frontend/vercel.json` - update the API rewrite:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.com/api/:path*"
    }
  ]
}
```

---

## Step 3: Deploy to Vercel

### Option A: Via Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to frontend folder:
```bash
cd frontend
```

3. Deploy:
```bash
vercel
```

4. Follow prompts:
   - Link to existing project? No
   - Project name: adelphe-connect
   - Directory: ./
   - Override settings? No

### Option B: Via Vercel Dashboard

1. Go to vercel.com/new
2. Import your Git repository
3. Set root directory to `frontend`
4. Framework Preset: Other
5. Build Command: `npx expo export --platform web`
6. Output Directory: `dist`
7. Click Deploy

---

## Step 4: Configure Custom Domain

1. In Vercel Dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `adelpheconnect.com`)
4. Vercel will show DNS records to configure

### DNS Configuration

Add these records at your domain registrar:

**For root domain (adelpheconnect.com):**
- Type: A
- Name: @
- Value: 76.76.21.21

**For www subdomain:**
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

### SSL Certificate
Vercel automatically provisions a free SSL certificate once DNS is verified.

---

## Step 5: Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add:
   - `EXPO_PUBLIC_BACKEND_URL` = your backend URL

---

## Deployment Checklist

- [ ] Backend deployed and running
- [ ] Backend URL updated in `.env.production`
- [ ] Backend URL updated in `vercel.json`
- [ ] Frontend deployed to Vercel
- [ ] Custom domain added in Vercel
- [ ] DNS records configured
- [ ] SSL certificate active
- [ ] Test login/register functionality
- [ ] Test all app features

---

## Troubleshooting

### API calls failing?
- Check backend URL is correct
- Ensure backend has CORS enabled for your domain
- Check Vercel function logs

### Build failing?
- Run `npx expo export --platform web` locally to test
- Check for TypeScript errors
- Ensure all dependencies are installed

### Domain not working?
- DNS propagation can take up to 48 hours
- Verify DNS records are correct
- Check Vercel domain status

---

## MongoDB Setup (If Needed)

If you don't have MongoDB yet:

1. Go to mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to backend environment as `MONGO_URL`

---

## Support

For issues with:
- Vercel: vercel.com/support
- Expo: docs.expo.dev
- MongoDB: mongodb.com/docs
