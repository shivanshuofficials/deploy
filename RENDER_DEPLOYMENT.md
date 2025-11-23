# Render Deployment Guide for UniMart

## Quick Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push
```

### 2. Create Render Account
- Go to https://render.com
- Sign up with GitHub

### 3. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select your repository

### 4. Configure Service

**Basic Settings:**
- **Name**: `unimart-marketplace`
- **Region**: Choose closest to you
- **Branch**: `main` or `master`
- **Root Directory**: (leave blank)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### 5. Environment Variables

Click **"Advanced"** and add these environment variables:

```
MONGODB_URI=mongodb+srv://shivanshuchauhan77_db_user:XLqe9g7QbtQgpoDS@cluster0.bp5qo4t.mongodb.net/?appName=Cluster0

JWT_SECRET=ae6bb17c34c5fb4ec2e1ed8cc84a1d930a76180d007a664f5930b5825e263a974de79aadb20d97e04d870c9acf5a56cf4643afbf98531fec7472aa264a2e02b5

JWT_EXPIRES_IN=7d

NODE_ENV=production

PORT=3000
```

### 6. Deploy
Click **"Create Web Service"**

Render will:
- Clone your repository
- Install dependencies
- Start your server
- Assign you a URL like: `https://unimart-marketplace.onrender.com`

### 7. After Deployment

Once deployed, you'll need to update CORS:

1. Note your Render URL (e.g., `https://unimart-marketplace.onrender.com`)
2. Go to Render Dashboard → Your Service → Environment
3. Update `ALLOWED_ORIGINS` to:
   ```
   http://localhost:3000,https://your-app-name.onrender.com
   ```
4. Save and redeploy

## Important Notes

✅ **What Works on Render:**
- All features including real-time chat
- WebSocket connections (Socket.IO)
- File uploads
- Database connections

⚠️ **Free Tier Limitations:**
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free (enough for one service running 24/7)

🔒 **Security Reminder:**
After deployment, rotate your MongoDB password and update the environment variable.

## Troubleshooting

**If deployment fails:**
1. Check build logs in Render dashboard
2. Verify all environment variables are set
3. Ensure `package.json` has correct start script

**If app doesn't load:**
1. Check service logs in Render dashboard
2. Verify MongoDB connection string is correct
3. Check that PORT environment variable is set

**If chat doesn't work:**
1. Update ALLOWED_ORIGINS with your Render URL
2. Redeploy the service
3. Clear browser cache

## Next Steps After Deployment

1. Test all features on the deployed URL
2. Update MongoDB password for security
3. Consider upgrading to paid tier for always-on service
4. Set up custom domain (optional)
