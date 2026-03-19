# EcomZone V2 - Frontend & Backend Separation Guide

## Overview

This document explains how the EcomZone application has been separated into independent frontend and backend projects.

## What Was Done

### Directory Structure
```
✓ Created /frontend/ directory
✓ Created /backend/ directory
✓ Copied app/ (without api/) to frontend/app/
✓ Copied public/, lib/, types/ to frontend/
✓ Copied api/ routes to backend/src/api/
✓ Copied prisma/ schema to backend/prisma/
✓ Created configuration files for both
```

### Files Created
- `frontend/package.json` - Frontend dependencies
- `backend/package.json` - Backend dependencies  
- `backend/src/server.ts` - Express server entry point
- `backend/.env.example` - Backend environment template
- `frontend/.env.example` - Frontend environment template
- `backend/tsconfig.json` - TypeScript config for backend
- `README_SEPARATED.md` - This guide

## Next Steps

### 1. Remove Old API Routes from Frontend

Currently, `app/api/` still exists in the root. These should be deleted once backend is running:

```bash
# After verifying backend works
rm -r app/api/
```

### 2. Update Frontend API Calls

All `fetch()` calls in frontend need to point to backend:

**Before:**
```javascript
const res = await fetch('/api/products')
```

**After:**
```javascript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
const res = await fetch(`${backendUrl}/api/products`)
```

Or create a utility:
```javascript
// frontend/lib/api.ts
export const api = {
  get: (path: string) => 
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api${path}`),
  post: (path: string, data: any) =>
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api${path}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    })
}
```

### 3. Update Backend API Structure

The API routes currently follow Next.js patterns. They need conversion to Express.js:

**Next.js pattern (in app/api/):**
```typescript
export async function GET(request: Request) {
  return NextResponse.json(data)
}
```

**Express pattern (in backend/src/api/):**
```typescript
import { Router, Request, Response } from 'express'
const router = Router()

router.get('/', (req: Request, res: Response) => {
  res.json(data)
})

export default router
```

### 4. Setup Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://user:password@localhost:5432/ecomzone
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
PORT=3001
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 5. Test Both Applications

Start backend first, then frontend:

```bash
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2 (wait for backend to start)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` and verify API calls work.

## Migration Checklist

- [ ] Copy files to frontend/ and backend/ (DONE)
- [ ] Create package.json for frontend (DONE)
- [ ] Create package.json for backend (DONE)
- [ ] Create server.ts entry point (DONE)
- [ ] Create environment variable templates (DONE)
- [ ] Install frontend dependencies: `cd frontend && npm install`
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Convert Next.js API routes to Express.js format
- [ ] Update frontend API endpoints (fetch calls)
- [ ] Setup .env files for both projects
- [ ] Test backend server starts
- [ ] Test frontend connects to backend
- [ ] Test authentication flow works
- [ ] Test product listing works
- [ ] Test admin features work
- [ ] Delete old `app/api/` from root
- [ ] Update deployment configurations

## Important Notes

### CORS Configuration
Backend has CORS enabled for `FRONTEND_URL`. Update when deploying:

```javascript
// backend/src/server.ts
origin: process.env.FRONTEND_URL || 'http://localhost:3000'
```

### Database Connection
Both will share the same PostgreSQL database via `DATABASE_URL`. Only backend needs direct Prisma access.

### Authentication Tokens
JWT tokens created by backend will be used by frontend. Ensure:
- `JWT_SECRET` is the same on backend
- Frontend stores tokens in localStorage/cookies
- Frontend sends tokens in Authorization headers

### File Uploads
If using file uploads, backend needs to handle storage (AWS S3, local, etc).

## Troubleshooting

### "Cannot connect to database"
- Verify DATABASE_URL is correct in `backend/.env`
- Check PostgreSQL is running: `psql -U postgres`
- Run migrations: `cd backend && npx prisma migrate dev`

### "Frontend can't reach backend"
- Verify backend is running on PORT 3001
- Check CORS settings allow frontend origin
- Verify NEXT_PUBLIC_BACKEND_URL in `frontend/.env.local`

### "API routes return 404"
- Express routes need to be mounted in `backend/src/server.ts`
- Check route path matches frontend fetch URL
- Verify API routes are in `backend/src/api/`

### TypeScript errors
- Run `npx tsc --noEmit` to check compilation
- Check tsconfig.json paths match directory structure
- Verify all imports use correct paths

## File Organization Reference

### Frontend Structure
```
frontend/
├── app/
│   ├── layout.tsx           (Root layout)
│   ├── page.tsx             (Home page)
│   ├── (other pages)
│   └── components/          (Reusable components)
├── lib/
│   ├── auth.ts              (Auth utilities)
│   ├── cart.ts              (Cart utilities)
│   └── ...
├── types/
│   └── index.ts             (Type definitions)
└── public/
    └── (static assets)
```

### Backend Structure
```
backend/
├── src/
│   ├── server.ts            (Express entry point)
│   ├── api/
│   │   ├── auth/            (Auth routes)
│   │   ├── products/        (Product routes)
│   │   ├── categories/      (Category routes)
│   │   ├── orders/          (Order routes)
│   │   └── ...
│   └── lib/
│       ├── prisma.ts        (Prisma client)
│       ├── auth.ts          (Auth middleware)
│       └── ...
└── prisma/
    ├── schema.prisma        (Database schema)
    └── migrations/          (Migration files)
```

## Questions?

Refer to:
1. `README_SEPARATED.md` - Quick start guide
2. Backend Express.js documentation
3. Frontend Next.js documentation
4. Original `README.md` - For feature documentation
