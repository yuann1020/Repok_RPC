# 🚀 Deployment Guide: Repok Pickleball Club

This guide outlines the steps to deploy the application to a production environment using modern hosting platforms.

---

## 🏗️ Platform Recommendations

We recommend the following stack for the easiest deployment experience:
- **Backend (NestJS)**: [Railway](https://railway.app) or [Render](https://render.com)
- **Frontend (Next.js)**: [Vercel](https://vercel.com)
- **Database (PostgreSQL)**: [Supabase](https://supabase.com) or Railway Managed Postgres.

---

## 1. Database Setup (Supabase / Railway)
1. Create a new PostgreSQL project.
2. Copy the **Database connection string** (URI).
3. Ensure it includes `?schema=public` at the end if using Prisma.

---

## 2. Backend Deployment (Railway)
1. Connect your GitHub repository to Railway.
2. Select the `backend` directory as the root (or set the build command to `npm install && npm run build`).
3. Set the following **Environment Variables**:
   - `DATABASE_URL`: Your Postgres connection string.
   - `JWT_SECRET`: A long, secure random string.
   - `PORT`: `3001` (Railway usually provides this automatically).
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: Your Gmail address.
   - `SMTP_PASS`: Your Gmail App Password.
   - `FRONTEND_URL`: The final production URL of your frontend (e.g., `https://repok.vercel.app`).
   - `GOOGLE_CLIENT_ID`: From Google Cloud Console.

---

## 3. Frontend Deployment (Vercel)
1. Import the repository into Vercel.
2. Set the `frontend` directory as the root.
3. Configure the **Build Settings**:
   - Build Command: `next build`
   - Output Directory: `.next`
4. Set the following **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://backend-production.up.railway.app`).
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: From Google Cloud Console.

---

## 🛰️ Post-Deployment Checklist
- [ ] **Prisma Migration**: Run `npx prisma migrate deploy` against your production database to create tables.
- [ ] **Admin Account**: Manually update a user's role to `ADMIN` in the database to gain access to the dashboard.
- [ ] **Google OAuth**: Add your production frontend URL to the "Authorized Javascript Origins" in your Google Cloud Console.

---

## 🛡️ Best Practices
- **CORS**: Ensure `FRONTEND_URL` in the backend exactly matches your Vercel URL.
- **Backups**: Enable automated daily backups on your database provider.
- **Monitoring**: Use tools like Vercel Analytics or Sentry for error tracking.
