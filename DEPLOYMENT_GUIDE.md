═══════════════════════════════════════════════════════════════════════════════════
                    DEPLOYMENT GUIDE - VERCEL & RENDER
═══════════════════════════════════════════════════════════════════════════════════

This guide explains how to deploy EcomZone to:
  - Frontend: Vercel (Next.js hosting)
  - Backend: Render (Node.js hosting)

═══════════════════════════════════════════════════════════════════════════════════

PART 1: DEPLOY BACKEND TO RENDER
═══════════════════════════════════════════════════════════════════════════════════

Step 1: Prepare Your Render Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://render.com
2. Sign up with GitHub (easier for deployment)
3. Connect your GitHub account

Step 2: Create PostgreSQL Database on Render
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to Render Dashboard (https://dashboard.render.com)
2. Click "+ New" → "PostgreSQL"
3. Fill in details:
   Name: ecomzone_db
   Database: ecomzone
   User: postgres (or custom)
   Region: Choose closest to you
   Version: 14 or higher
4. Click "Create Database"
5. ⚠️ IMPORTANT: Save the "Internal Database URL" - you'll need it!
   Format: postgresql://user:password@host:port/database

Step 3: Deploy Backend Service
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to Render Dashboard
2. Click "+ New" → "Web Service"
3. Connect to your GitHub repository (ecomzone)
4. Fill in details:
   Name:              ecomzone-backend
   Environment:       Node
   Build Command:     npm install && npm run build && npx prisma generate
   Start Command:     npm run start
   Plan:              Free (or Starter if you want)
   Region:            Choose same as database
   Root Directory:    backend
   
5. Click "Advanced" and add Environment Variables:
   
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=[Paste the Internal Database URL from Step 2]
   JWT_SECRET=generate-a-random-string-here
   FRONTEND_URL=https://ecomzone.vercel.app (update later with your Vercel URL)
   
   TIP: Generate JWT_SECRET with: openssl rand -hex 32
        Or just use any long random string like: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

6. Click "Deploy Web Service"
7. Wait 3-5 minutes for deployment
8. Once complete, you'll see a URL like: https://ecomzone-backend-xxxx.onrender.com
9. ⚠️ SAVE THIS URL - you need it for the frontend!

Step 4: Verify Backend Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test the health endpoint:
  https://ecomzone-backend-xxxx.onrender.com/health
  
Expected response:
  {
    "status": "Backend server is running",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }

═══════════════════════════════════════════════════════════════════════════════════

PART 2: DEPLOY FRONTEND TO VERCEL
═══════════════════════════════════════════════════════════════════════════════════

Step 1: Prepare Your Vercel Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://vercel.com
2. Sign up with GitHub
3. Import Project → Select "ecomzone" repository
4. Choose "Next.js" framework (auto-detected)

Step 2: Configure Environment Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In Vercel Dashboard → Settings → Environment Variables, add:

NEXT_PUBLIC_BACKEND_URL=https://ecomzone-backend-xxxx.onrender.com
NEXT_PUBLIC_API_URL=https://ecomzone-backend-xxxx.onrender.com/api

(Replace with your actual Render backend URL from Step 3.9)

Step 3: Deploy Frontend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. In Vercel, click "Deploy"
2. Select root directory: frontend
3. Configure project:
   Framework: Next.js
   Build Command: npm run build
   Output Directory: .next
4. Click "Deploy"
5. Wait 2-3 minutes
6. You'll get a URL like: https://ecomzone-xxxx.vercel.app
7. ⚠️ SAVE THIS URL - you need it for the backend!

Step 4: Update Backend with Frontend URL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Go back to Render Dashboard:
1. Click on your backend service
2. Go to Settings → Environment
3. Find FRONTEND_URL variable
4. Update to: https://ecomzone-xxxx.vercel.app
5. Click "Save"
6. The service will automatically redeploy

Step 5: Verify Frontend Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open: https://ecomzone-xxxx.vercel.app
2. Check browser console (F12) for errors
3. Try making an API call to verify backend connection
4. If you see CORS errors, the FRONTEND_URL wasn't updated properly

═══════════════════════════════════════════════════════════════════════════════════

PART 3: CONNECT DATABASE TO BACKEND
═══════════════════════════════════════════════════════════════════════════════════

The database is created but migrations need to run:

Option 1: Run Migrations Manually (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. In your local machine, go to backend folder:
   cd d:\ecomzone_V2\backend

2. Set your production database URL:
   $env:DATABASE_URL = "postgresql://user:password@host:port/ecomzone"

3. Run migrations:
   npx prisma migrate deploy

4. This creates all tables in your Render database

Option 2: Use Render Deployment Build
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The build command already includes:
  npx prisma generate

So migrations might auto-run during deployment.
Check Render's deployment logs to confirm.

═══════════════════════════════════════════════════════════════════════════════════

TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════════

Frontend Issues:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: "Can't connect to backend" (404 errors)
Solution:
  1. Check NEXT_PUBLIC_BACKEND_URL in Vercel settings
  2. Verify Render backend is running (check status)
  3. Try accessing backend health endpoint directly

Issue: Blank page after deployment
Solution:
  1. Check Vercel build logs
  2. Ensure "frontend" is the root directory
  3. Check for TypeScript errors

Backend Issues:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: "Error: Can't connect to database"
Solution:
  1. Verify DATABASE_URL is correct in Render settings
  2. Check PostgreSQL service status on Render
  3. Try connection string in Prisma Studio locally

Issue: Deployment fails with "Prisma" errors
Solution:
  1. Ensure build command includes: npx prisma generate
  2. Run locally: npm run build
  3. Check TypeScript compilation

CORS Errors:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Issue: CORS errors when frontend calls backend
Solution:
  1. Check FRONTEND_URL is set in backend .env
  2. Verify NEXT_PUBLIC_BACKEND_URL in frontend .env
  3. Restart backend service on Render
  4. Clear browser cache (Ctrl+Shift+Delete)

═══════════════════════════════════════════════════════════════════════════════════

USEFUL LINKS
═══════════════════════════════════════════════════════════════════════════════════

Render:
  - Dashboard: https://dashboard.render.com
  - Docs: https://render.com/docs
  - PostgreSQL Docs: https://render.com/docs/databases

Vercel:
  - Dashboard: https://vercel.com/dashboard
  - Docs: https://vercel.com/docs
  - Next.js Deployment: https://nextjs.org/docs/deployment/vercel

Prisma:
  - Studio: npx prisma studio
  - Docs: https://www.prisma.io/docs/

═══════════════════════════════════════════════════════════════════════════════════

QUICK CHECKLIST
═══════════════════════════════════════════════════════════════════════════════════

Backend (Render):
  ☐ GitHub account connected to Render
  ☐ PostgreSQL database created on Render
  ☐ Backend service created and deployed
  ☐ Environment variables set correctly
  ☐ Health endpoint responds
  ☐ Database migrations run
  ☐ Backend URL saved

Frontend (Vercel):
  ☐ GitHub account connected to Vercel
  ☐ Project imported from GitHub
  ☐ Environment variables set (BACKEND_URL, API_URL)
  ☐ Frontend deployed successfully
  ☐ Can open in browser
  ☐ No console errors
  ☐ Frontend URL saved

Integration:
  ☐ Update backend FRONTEND_URL with actual Vercel URL
  ☐ Test API calls from frontend to backend
  ☐ Check CORS headers
  ☐ Verify authentication works
  ☐ Test file uploads/downloads

═══════════════════════════════════════════════════════════════════════════════════
