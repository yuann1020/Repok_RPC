# Repok System Feature Report

This document details the core features of the Repok Pickleball Court Booking System, explaining their purpose, workflow, and engineering implementation.

## 1. Authentication & Role-Based Access Control
- **Purpose**: Secure user access and differentiate between customers and administrators.
- **User Flow**: Users register/login via email or Google Sign-In. Admins log into a specialized dashboard route.
- **Implementation**:
  - **Backend**: Uses NestJS Guards and Passport.js for JWT validation. Role verification (`CUSTOMER` vs `ADMIN`) is handled by custom decorators.
  - **Frontend**: Context providers and Next.js middleware restrict access to `/admin/*` routes.
- **Resume Point**: Implemented secure JWT-based authentication with OAuth (Google Sign-In) and role-based access control.

## 2. Court Browsing & Availability
- **Purpose**: Allow users to explore venues and find open slots.
- **User Flow**: Users view a list of courts, click for details, and select a date to view a grid of available times.
- **Implementation**:
  - **Backend**: Efficient SQL queries via Prisma to fetch courts and nested `CourtAvailability` records, filtering out booked or blocked slots.
  - **Frontend**: React Query caches availability data. Zustand manages the selected date and slot states.

## 3. Booking Creation & Expiry Auto-Release
- **Purpose**: Reserve consecutive slots with a grace period for payment.
- **User Flow**: User selects slots, confirms booking, and is given a countdown timer to complete payment. If unpaid, the booking expires.
- **Implementation**:
  - **Backend**: Booking creation uses a Prisma Transaction to ensure atomic database writes. A cron job or background worker checks for expired, unpaid bookings and automatically updates the `CourtAvailability` status back to available. The timer is configurable via the `BOOKING_HOLD_MINUTES` environment variable (defaults to 10 minutes).
  - **Resume Point**: Designed transaction-safe booking creations with automated expiry logic to release unpaid reserved slots and prevent revenue loss.

## 4. Wallet System & Stripe Checkout Top-Up
- **Purpose**: Provide a seamless, prepay credit system for frequent players.
- **User Flow**: Users select a predefined package (e.g., RM50 for 50 credits) or a custom amount. They are redirected to Stripe Checkout. Upon success, credits are added to their wallet.
- **Implementation**:
  - **Backend**: Generates a Stripe Checkout Session. A webhook endpoint listens for `checkout.session.completed`. The webhook credits the wallet only from a stored `TopUpOrder` and only if the order is still `PENDING`, so duplicate webhook retries do not double-credit the wallet.
  - **Database Models**: `Wallet`, `WalletTransaction`, `TopUpOrder`.
  - **Resume Point**: Integrated Stripe Checkout for digital wallet top-ups, utilizing idempotent webhook handling to improves transactional consistency.

## 5. Wallet Booking Payment
- **Purpose**: Fast checkout using pre-loaded credits.
- **User Flow**: On the checkout page, the user selects "Pay with Wallet". The booking is confirmed instantly if balance is sufficient.
- **Implementation**:
  - **Backend**: A Prisma transaction deducts the wallet balance, records a `WalletTransaction`, updates the `Payment` to `PAID`, and marks the `Booking` as `CONFIRMED`.

## 6. Manual QR Payment & Admin Review
- **Purpose**: Support local payment methods like Touch 'n Go or DuitNow via QR code.
- **User Flow**: User scans a static QR, transfers money, and uploads the receipt. Admin reviews the receipt and approves/rejects it.
- **Implementation**:
  - **Backend**: Handles image upload, updates `Payment` to `PENDING_REVIEW`. Admin endpoints allow updating the status to `PAID` or `FAILED`.
  - **Frontend**: Admin dashboard features a queue of pending payments with modal image viewers.
  - **Resume Point**: Built an admin workflow for manual payment verification, supporting localized payment methods alongside automated credit cards.

## 7. Booking Confirmation Email
- **Purpose**: Confirm successful transactions and bookings to the user.
- **User Flow**: After successful wallet payment or admin manual QR approval, the user receives a confirmation email.
- **Implementation**:
  - **Backend**: Uses Nodemailer with Gmail SMTP to dispatch templated emails asynchronously.

## 8. Admin Analytics Dashboard
- **Purpose**: Provide business insights to management.
- **User Flow**: Admin views charts for revenue, court usage, and booking statuses, filterable by month.
- **Implementation**:
  - **Backend**: Aggregation endpoints calculate metrics (e.g., total revenue from `PAID` payments only).
  - **Frontend**: Integrates Recharts to render interactive Bar, Line, and Pie charts.
  - **Resume Point**: Developed a Recharts-powered analytics dashboard calculating real-time business metrics including revenue trends and peak hour utilization.

## 9. Announcement System
- **Purpose**: Broadcast information to users.
- **Implementation**: CRUD operations for admins to create `Announcement` records, which are fetched and displayed on the user dashboard.

## 10. Mobile Responsiveness & Deployment
- **Implementation**: Tailwind CSS ensures a fluid layout across devices. Vercel hosts the Next.js frontend and provides automated deployment from GitHub. Railway runs the NestJS server API, and Supabase hosts the PostgreSQL database for reliable data operations.
