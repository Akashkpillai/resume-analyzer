# Render Deployment Guide

This guide will help you deploy your NestJS backend to Render.

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A PostgreSQL database (you can create one on Render or use an external service)
3. Your GitHub repository connected to Render

## Step-by-Step Deployment

### 1. Prepare Your Database

#### Option A: Create PostgreSQL Database on Render
1. Go to your Render dashboard
2. Click "New +" → "PostgreSQL"
3. Fill in the details:
   - **Name**: `resume-analyzer-db` (or your preferred name)
   - **Database**: `resume_analyzer` (or your preferred name)
   - **User**: Auto-generated
   - **Region**: Choose closest to your users
4. Click "Create Database"
5. Copy the **Internal Database URL** (you'll need this later)

#### Option B: Use External PostgreSQL
- Use any PostgreSQL provider (AWS RDS, Supabase, Railway, etc.)
- Make sure you have the connection string ready

### 2. Deploy Your Backend Service

#### Method 1: Using render.yaml (Recommended)
1. The `render.yaml` file is already created in the `backend/` directory
2. In Render dashboard, click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Review the configuration and click "Apply"

#### Method 2: Manual Setup (Node.js Service)
1. In Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `resume-analyzer-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
     - Note: `prisma generate` runs automatically via the `postinstall` script
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: Free tier or paid (recommended: Starter for production)

### 3. Set Environment Variables

In your Render service settings, go to "Environment" and add these variables:

#### Required Environment Variables:

1. **DATABASE_URL**
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
   - Use the Internal Database URL from your Render PostgreSQL service
   - Or your external database connection string

2. **JWT_SECRET**
   - Generate a strong random string (at least 32 characters)
   - You can generate one using: `openssl rand -base64 32`
   - Example: `your-super-secret-jwt-key-here-minimum-32-chars`

3. **GROQ_API_KEY**
   - Get your API key from https://console.groq.com/
   - Format: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **NODE_ENV**
   - Set to: `production`
   - Note: This is already set in `render.yaml` if using Blueprint method

5. **PORT**
   - Render automatically sets this for Node.js services (usually `10000`)
   - You don't need to set this manually - your code already uses `process.env.PORT || 3001`

### 4. Run Database Migrations

After your service is deployed, you need to run Prisma migrations:

#### Option A: Using Render Shell
1. Go to your service in Render dashboard
2. Click on "Shell" tab
3. Run: `npx prisma migrate deploy`

#### Option B: Using Local Terminal
1. Set your DATABASE_URL environment variable
2. Navigate to backend directory
3. Run: `npx prisma migrate deploy`

### 5. Update CORS Settings

Your `main.ts` already has CORS configured for your frontend. Make sure the frontend URL is correct:
- `https://resume-analyzer-rosy.vercel.app` (already configured)

If you need to add more origins, update the `origin` array in `backend/src/main.ts`.

### 6. Verify Deployment

1. Check the logs in Render dashboard to ensure the service started successfully
2. Visit your service URL: `https://your-service-name.onrender.com`
3. Test the Swagger docs: `https://your-service-name.onrender.com/api`
4. Test an API endpoint to ensure it's working

### 7. Update Frontend API URL

Update your frontend to use the new backend URL:
- Change the API base URL from `http://localhost:3001` to `https://your-service-name.onrender.com`

## Important Notes

### Free Tier Limitations
- Render free tier services **spin down after 15 minutes of inactivity**
- First request after spin-down may take 30-60 seconds (cold start)
- For production, consider upgrading to a paid plan

### Database Migrations
- Always run migrations after deploying
- Use `prisma migrate deploy` for production (not `prisma migrate dev`)

### File Uploads
- The current setup stores files in the `uploads/` directory
- On Render, this is ephemeral storage (files will be lost on redeploy)
- Consider using cloud storage (AWS S3, Cloudinary, etc.) for production

### Environment Variables
- Never commit `.env` files to Git
- Always set sensitive variables in Render dashboard
- Use Render's environment variable sync for database URLs if using Render PostgreSQL

## Troubleshooting

### Service Won't Start
- Check build logs for errors
- Ensure all environment variables are set
- Verify Prisma Client is generated (`npx prisma generate`)

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if database allows connections from Render's IPs
- Ensure SSL mode is set correctly

### CORS Errors
- Verify frontend URL is in the CORS origin list
- Check that credentials are properly configured

### Migration Errors
- Ensure database exists and is accessible
- Check DATABASE_URL format
- Run migrations manually if needed

## Next Steps

1. Set up automatic deployments from your main branch
2. Configure custom domain (if needed)
3. Set up monitoring and alerts
4. Consider adding health check endpoints
5. Implement proper file storage solution for uploads

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Prisma Documentation: https://www.prisma.io/docs

