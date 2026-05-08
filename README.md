# Multi-SPV Financial Dashboard

## Project Overview

Multi-SPV Financial Dashboard is a full-stack web application for tracking Special Purpose Vehicle investments. Users can register, log in, view SPV opportunities, maintain holdings and a watchlist, execute buy/sell and basket transactions, compare SPVs, view alerts, and download reports.

The project is intentionally simple for college evaluation. Authentication uses one JWT access token, passwords are hashed with bcrypt, and protected frontend routes redirect users to the login page.

## Technologies Used

Frontend:

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Zustand for state
- Axios for API calls
- React Router for routing
- Recharts for charts
- Socket.IO client for live alerts

Backend:

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- Socket.IO for live alerts
- node-cron for scheduled SPV analysis

## Folder Structure

```text
Multi-SPV Financial Dashboard - Copy/
  backend/
    prisma/
      schema.prisma       Database models
      seed.ts             Demo seed data
    src/
      controllers/        Request handlers
      middleware/         JWT auth middleware
      routes/             Express routes
      cron/               Scheduled alert/recommendation job
      services/           Recommendation logic
      index.ts            Backend entry point
    .env.example
    package.json
  frontend/
    src/
      components/         Layout, protected route, modals
      pages/              Dashboard screens and login page
      store/              Zustand auth and portfolio stores
      utils/              Currency formatter
      api.ts              Central Axios/API config
      App.tsx             Route definitions
    .env.example
    package.json
  run.bat                 Starts frontend and backend in two terminals
  README.md
```

## Authentication Flow

1. A user registers with email and password.
2. The backend hashes the password using bcrypt.
3. The backend creates the user in PostgreSQL.
4. The backend signs a JWT containing the user id, email, and role.
5. The frontend stores the JWT in localStorage under `auth_token`.
6. Axios automatically sends the token as:

```text
Authorization: Bearer <token>
```

7. Protected backend routes verify the token before returning user-specific data.
8. Logout removes the token from localStorage and redirects to the login page.

## How JWT Authentication Works Here

The backend uses `JWT_SECRET` from `backend/.env` to sign and verify tokens. The token stores only basic user identity:

```text
id, email, role
```

The token does not store passwords or portfolio data. When a protected API route is called, the middleware verifies the token and attaches the authenticated user to the request. Controllers then use `req.user.id` instead of a hardcoded user id.

## How Protected Routes Work

Frontend protected pages are wrapped with `ProtectedRoute`.

- If no token exists, the user is redirected to `/login`.
- If a token exists, the frontend calls `/api/auth/me`.
- If the token is valid, the dashboard loads.
- If the token is invalid, the user is logged out.

## Database Usage

The app uses PostgreSQL through Prisma.

Important models:

- `User`: login account and cash balance
- `SPV`: investment opportunity
- `FinancialData`: historical SPV metrics
- `Transaction`: buy/sell transactions owned by a user
- `PortfolioHolding`: user-specific holdings
- `Watchlist`: user-specific watchlist
- `Alert`: global or user-specific alerts
- `Report`: user-owned report records

User-specific data is stored using `userId`. Portfolio, transaction, watchlist, report, and user alerts are connected to the logged-in user.

## Environment Variables Setup

Create this file:

```text
backend/.env
```

Example:

```env
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/multispv"
JWT_SECRET="my-college-project-secret-key"
CORS_ORIGIN="http://localhost:5173"
```

Create this file:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:3001/api
```

## Local Setup Commands

Open Terminal 1 for backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```

Backend expected URL:

```text
http://localhost:3001
```

Open Terminal 2 for frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend expected URL:

```text
http://localhost:5173
```

You can also run both after installing dependencies:

```bat
run.bat
```

## Build Commands

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
```

## Demo Login

After running the seed command, use:

```text
Email: investor@nexus.com
Password: password123
```

You can also create a new account from the Register tab on the login page.

## How To Verify Login/Register

1. Start backend and frontend.
2. Open `http://localhost:5173`.
3. You should be redirected to `/login`.
4. Register a new account or log in with the demo account.
5. After login, the dashboard should load.
6. Open browser dev tools and confirm API calls include `Authorization: Bearer ...`.
7. Click Logout in the sidebar.
8. The app should return to the login page.

## API Endpoints Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

SPVs:

- `GET /api/spvs`
- `GET /api/spvs/:id`

Portfolio:

- `GET /api/portfolio`
- `POST /api/portfolio/watchlist`

Transactions:

- `POST /api/transactions`
- `POST /api/transactions/basket`

Alerts:

- `GET /api/alerts`

Health:

- `GET /health`

## Deployment: Render Backend

1. Push the project to GitHub.
2. Create a PostgreSQL database on Render.
3. Create a new Render Web Service for the backend.
4. Set root directory:

```text
backend
```

5. Set build command:

```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

6. Set start command:

```bash
npm start
```

7. Add environment variables:

```env
DATABASE_URL=<Render PostgreSQL connection string>
JWT_SECRET=<long random secret>
PORT=3001
CORS_ORIGIN=<your Vercel frontend URL>
```

8. After deploy, your backend URL will look like:

```text
https://your-backend.onrender.com
```

## Deployment: Vercel Frontend

1. Create a new Vercel project from GitHub.
2. Set root directory:

```text
frontend
```

3. Set build command:

```bash
npm run build
```

4. Set output directory:

```text
dist
```

5. Add frontend environment variable:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

6. Redeploy after adding environment variables.

## Common Troubleshooting

Backend cannot connect to database:

- Check `backend/.env`.
- Confirm `DATABASE_URL` points to PostgreSQL.
- Run `npx prisma db push`.

Login says invalid token:

- Confirm `JWT_SECRET` exists in `backend/.env`.
- Restart the backend after editing `.env`.
- Logout and log in again.

Frontend API calls fail:

- Check `frontend/.env`.
- Confirm `VITE_API_URL=http://localhost:3001/api` locally.
- Restart Vite after editing `.env`.

PowerShell blocks npm:

Use:

```bash
npm.cmd install
npm.cmd run dev
```

Prisma client is outdated:

```bash
cd backend
npx prisma generate
```

Seed login does not work:

```bash
cd backend
npx ts-node prisma/seed.ts
```

## Final Verification Checklist

- Backend starts on `http://localhost:3001`.
- Frontend starts on `http://localhost:5173`.
- `/health` returns healthy JSON.
- Register creates a new user.
- Login returns a JWT and opens the dashboard.
- Logout returns to `/login`.
- Dashboard loads portfolio data for the logged-in user.
- Buy, sell, hold, and basket investment actions still work.
- Alerts page loads and receives live alerts.
- Reports page can download Excel and PDF files.
- `npm run build` works in backend.
- `npm run build` works in frontend.
