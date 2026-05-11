# Repok Pickleball Court Booking System

> A full-stack sports venue booking and management platform designed for pickleball clubs.

![Screenshot Preview](docs/images/homepage.jpg)

## 📸 Screenshots

### Customer Experience
| Courts | Court Booking | My Bookings |
|---|---|---|
| ![Courts](docs/images/courts.jpg) | ![Court Booking](docs/images/court-detail.jpg) | ![My Bookings](docs/images/my-bookings.jpg) |

### Payment & Checkout
| Payment Page - Wallet Section | Payment Page - Manual QR Section |
|---|---|
| ![Payment Wallet](docs/images/payment-wallet-qr1.jpg) | ![Payment Manual QR](docs/images/payment-wallet-qr2.jpg) |

### Wallet & Top-Up
| Wallet | Wallet Top-Up | Stripe Checkout |
|---|---|---|
| ![Wallet](docs/images/wallet.jpg) | ![Wallet Top-Up](docs/images/wallet-top-up.jpg) | ![Stripe Checkout](docs/images/stripe-top-up.jpg) |

### Admin Dashboard
| Payment Review | Analytics |
|---|---|
| ![Payment Review](docs/images/admin-payments.jpg) | ![Analytics](docs/images/admin-analytics.jpg) |

### Mobile
| Mobile Navigation |
|---|
| ![Mobile Navigation](docs/images/mobile-nav.jpg) |

## 📖 Overview

Repok is a modern, end-to-end venue management system tailored for pickleball facilities. It provides a seamless booking experience for players and a comprehensive management dashboard for administrators. Customers can easily browse courts, select time slots, and pay via an integrated digital wallet or manual QR upload. Administrators can oversee courts, handle approvals, and track revenue through an interactive analytics dashboard.

**[Live Demo](#) | [Demo Video](#)**  
*(Replace placeholders with actual links)*

## 🚀 Tech Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, TanStack React Query, Zustand, Recharts, Axios, Vercel Deployment  
**Backend:** NestJS, TypeScript, Prisma ORM, JWT Authentication, Stripe Webhooks, Nodemailer, Railway Deployment  
**Database:** PostgreSQL (hosted on Supabase)

## ✨ Key Features

### 🎾 Customer Features
- **Authentication & Profiles:** Secure registration, login, and Google Sign-In.
- **Court Browsing:** View available courts, amenities, and detailed descriptions.
- **Smart Booking System:** Select dates and consecutive time slots with real-time availability checking.
- **Booking Expiry Countdown:** Unpaid pending bookings expire automatically (configurable hold timer, default 10 minutes), releasing slots back to the public.
- **Booking Management:** Dedicated portal to view active, past, and expired bookings.
- **Mobile Responsive:** Fully optimized navigation for mobile users.

### 💰 Payment & Wallet System
- **Digital Wallet:** Built-in credit system (1 Credit = RM1).
- **Stripe Wallet Top-Up:** Secure checkout for wallet top-ups with fixed packages (e.g., RM50, RM100).
- **Custom Top-Up:** Top up with any custom amount.
- **Wallet Booking Payment:** Pay for bookings instantly using available wallet credits.
- **Manual QR Payment:** Upload proof of payment for manual admin verification.
- **Booking Confirmation Email:** Automated confirmation email dispatched after successful wallet payment or admin manual QR approval.

### 🛡️ Admin Features
- **Court Management:** Add, edit, or disable courts and configure pricing.
- **Availability Control:** Generate, block, or unblock specific time slots.
- **Admin Payment Review:** Review, approve, or reject manual QR payment proofs.
- **Announcements:** Broadcast important updates to customers.
- **Admin Analytics Dashboard:** Recharts-powered visualization of revenue trends, booking volume, court utilization, peak hours, and payment sources.

## 🏗️ Architecture Overview

The system is split into a Next.js frontend (client & admin panels) and a NestJS REST API backend. State management is handled by React Query (server state) and Zustand (client state). The PostgreSQL database is managed by Prisma ORM and hosted on Supabase.

```mermaid
graph TD
    Client[Web Browser / Mobile] -->|HTTPS| Frontend[Next.js App on Vercel]
    Frontend -->|REST API| Backend[NestJS API on Railway]
    Backend <-->|Prisma ORM| DB[(PostgreSQL on Supabase)]
    Backend <-->|Stripe SDK| Stripe[(Stripe API)]
    Stripe -->|Webhook| Backend
    Backend -->|SMTP| Email[Email Service]
```

## 🗄️ Database Models

- **User**: Authentication, roles, and profiles.
- **Court & CourtAvailability**: Venues and their time slots.
- **Booking & BookingItem**: Reservations and linked time slots.
- **Payment**: Transaction records and statuses.
- **Wallet, WalletTransaction, TopUpOrder**: User credit system.
- **Announcement**: Admin broadcasts.

## 🛠️ Local Setup Guide

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/repok-booking.git
   cd repok-booking
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create a .env file (see guide below)
   npx prisma generate --schema=../prisma/schema.prisma
   npx prisma migrate deploy --schema=../prisma/schema.prisma
   npm run start:dev
   ```
   > Use `npx prisma migrate dev --schema=../prisma/schema.prisma` only when creating new local migrations. Avoid recommending `db push` as the default.

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Create a .env.local file
   npm run dev
   ```

## 🔐 Environment Variables

**Backend (`.env`)**
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=http://localhost:3000
DATABASE_URL="postgresql://user:password@host:port/db"
JWT_SECRET="your_jwt_secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
GOOGLE_CLIENT_ID="your_google_client_id"
BOOKING_HOLD_MINUTES="10"
```

**Frontend (`.env.local`)**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id"
```

## 🚀 Deployment

- **Frontend**: Deployed on Vercel. Connect the GitHub repository, set environment variables, and deploy.
- **Backend**: Deployed on Railway. Link the repo, add environment variables, and build.
- **Database**: PostgreSQL hosted on Supabase.

## 📝 Future Improvements
- Subscription-based memberships.
- Court pairing algorithm for tournaments.
- In-app chat for customer support.

---
*Developed by [Louis Lau](https://github.com/yourusername)*
