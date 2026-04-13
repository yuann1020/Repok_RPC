# 🎾 Repok Pickleball Club | Premium Booking System

A state-of-the-art, "dark luxury" sports-tech platform designed for elite pickleball clubs. This full-stack application provides a seamless experience for both players and administrators, featuring a sophisticated glassmorphic UI and robust management tools.

---

## ✨ Key Features

### 👤 Player Experience
- **Premium Booking Hub**: Intuitive scheduling with real-time slot availability.
- **Announcements & Community**: Stay updated with high-resolution photo galleries and club news.
- **Unified Profile**: Manage bookings, transaction history, and security settings.

### 🛡️ Administrative Power
- **JIT Availability Manager**: Just-In-Time slot generation with a "click-to-block" interface.
- **Financial Oversight**: Bulk management of payments and bookings with CSV export functionality.
- **Announcement Center**: Multi-media content management system with gallery support.
- **User Directory**: Centralized management of club members and permissions.

---

## 🏛️ Project Architecture

The application is built with a modern, scalable monorepo structure:

- **Frontend**: `Next.js 14`, `Tailwind CSS`, `Framer Motion`, `Lucide Icons`.
- **Backend**: `NestJS`, `TypeScript`, `Passport.js` (JWT & Google Auth), `Nodemailer`.
- **Data Layer**: `PostgreSQL`, `Prisma ORM`.
- **DevOps**: `Docker`, `GitHub Actions` (CI).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+ 
- Docker (for database) 
- Gmail App Password (for SMTP)

### 2. Environment Setup
Create `.env` files in both directories based on the templates:
```bash
cp ./backend/.env.example ./backend/.env
cp ./frontend/.env.example ./frontend/.env
```

### 3. Spin up the Stack
```bash
# Start the database
docker-compose up -d

# Install dependencies (Root)
npm install

# Run Backend
cd backend && npm run start:dev

# Run Frontend
cd ../frontend && npm run dev
```

---

## 🛠️ Deployment Roadmap
For a professional production environment, we recommend:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Railway](https://railway.app) or [Render](https://render.com)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL) or Railway Managed DB.

---

## 📜 Repository Guidelines
- **Branches**: Multi-stage (main, dev, feature/*).
- **Commits**: Follow conventional commits (feat:, fix:, chore:).
- **Documentation**: Detailed guides available in the `docs/` folder.

---

*Built with ❤️ for the Pickleball Community.*
