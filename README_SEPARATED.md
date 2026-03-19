# EcomZone V2 - Separated Frontend & Backend

This directory contains a separated frontend and backend structure for the EcomZone e-commerce application.

## Project Structure

```
ecomzone_V2/
├── frontend/          # Next.js Frontend Application
│   ├── app/          # Next.js App Router (pages, components)
│   ├── public/       # Static assets
│   ├── lib/          # Client utilities
│   ├── types/        # TypeScript type definitions
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
│
└── backend/          # Express.js Backend API
    ├── src/
    │   ├── server.ts     # Express server entry point
    │   ├── api/          # API routes (migrated from app/api)
    │   └── lib/          # Backend utilities (Prisma, auth, etc)
    ├── prisma/           # Database schema and migrations
    ├── package.json
    ├── .env.example      # Environment variables template
    └── tsconfig.json
```

## Getting Started

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- PostgreSQL database

### Setup Backend

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and other secrets
   ```

3. **Setup database:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Start backend server:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:3001`

### Setup Frontend

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your BACKEND_URL (should match backend port)
   ```

3. **Start frontend development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Frontend

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/ecomzone |
| JWT_SECRET | JWT signing secret | your_secret_key |
| FRONTEND_URL | Frontend application URL | http://localhost:3000 |

### Frontend (.env.local)

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_BACKEND_URL | Backend API base URL | http://localhost:3001 |
| NEXT_PUBLIC_API_URL | Backend API routes URL | http://localhost:3001/api |
| NEXT_PUBLIC_APP_NAME | Application name | EcomZone |

## API Documentation

Backend API is available at `http://localhost:3001/api`

### Key Endpoints

- **Auth:** `/api/auth/*` - Login, signup, profile
- **Products:** `/api/products*` - List, search, filter products
- **Categories:** `/api/categories*` - Category management
- **Orders:** `/api/orders*` - Order management
- **Admin:** `/api/admin/*` - Admin operations
- **Payment:** `/api/payment/*` - Payment gateway integration

## Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Form Handling:** HTML form elements
- **PDF Generation:** PDF-lib, jsPDF, html2canvas

### Backend
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** JWT + bcryptjs
- **Email:** Nodemailer
- **File Upload:** Multer
- **Language:** TypeScript
- **CORS:** Enabled for frontend domain

## Development Workflow

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. Open browser to `http://localhost:3000`

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start  # Requires .env file with production values
```

### Frontend
```bash
cd frontend
npm run build
npm start  # Requires .env.local file
```

## Deployment

### Backend (Recommended: Render, Heroku, Railway)
- Set environment variables on hosting platform
- Deploy from `backend/` directory
- Start command: `npm start`

### Frontend (Recommended: Vercel, Netlify)
- Set environment variables on hosting platform
- Deploy from `frontend/` directory
- Build command: `npm run build`
- Start command: `npm start`

## Troubleshooting

### Backend won't connect to database
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is running
- Check network/firewall settings

### Frontend can't reach backend API
- Verify backend is running on PORT (default 3001)
- Check BACKEND_URL in `.env.local`
- Check CORS is properly configured in backend

### Database migration errors
- Ensure migrations haven't been modified
- Run: `npx prisma migrate reset` (DEV ONLY - resets database)
- Check Prisma schema syntax

## Contributing

When adding new features:
1. Backend changes → Update API routes in `backend/src/api/`
2. Frontend changes → Update pages/components in `frontend/app/`
3. Database changes → Update Prisma schema → Run migration
4. Test both frontend and backend together

## License

Proprietary - EcomZone V2 © 2024

## Support

For issues or questions, contact the development team.
