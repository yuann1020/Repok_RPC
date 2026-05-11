# Resume Case Study: Repok Pickleball Booking System

## Project Summary
Repok is a full-stack sports venue booking and management platform built to streamline operations for a pickleball club. It features a robust Next.js frontend and NestJS backend, supporting automated court reservations, a digital wallet payment system via Stripe, and a comprehensive admin analytics dashboard. The system handles end-to-end user flows, from OAuth authentication to automated booking expiries and manual payment approvals.

## Problem Statement
The pickleball club previously managed bookings manually via messaging apps, leading to double-bookings, delayed payments, and significant administrative overhead. They lacked a centralized system to track revenue, manage court availability dynamically, and offer a seamless customer checkout experience.

## My Solution
I architected and developed a custom, scalable web application using a modern TypeScript stack (Next.js + NestJS + PostgreSQL). I implemented a transaction-safe booking engine that guarantees slot availability, a digital wallet system for friction-less payments, and an automated expiry mechanism to reclaim unpaid slots. For admins, I built a data-rich dashboard for court management and financial analytics.

## System Architecture
- **Frontend**: Next.js 14, React, Tailwind CSS, React Query, Zustand.
- **Backend**: NestJS, Prisma ORM, JWT, Stripe Webhooks, Nodemailer.
- **Database**: PostgreSQL (hosted on Supabase).
- **Deployment**: Vercel (Frontend), Railway (Backend).

## Key Technical Challenges & Solutions

### 1. Handling Concurrent Bookings
**Challenge**: Multiple users attempting to book the exact same court slots simultaneously could lead to double-booking.
**Solution**: Leveraged Prisma Transactions and database-level unique constraints (`[courtId, startTime, endTime]`) to ensure atomicity. Only the first transaction successfully locks and updates the availability; subsequent requests are safely rejected.

### 2. Reliable Payment Processing & Wallet Top-ups
**Challenge**: Network failures during Stripe Checkout redirection or duplicate webhook events could result in a user paying but not receiving wallet credits, or receiving double credits.
**Solution**: Implemented an idempotent webhook listener for `checkout.session.completed`. The webhook credits the wallet only from a stored `TopUpOrder` and only if the order is still in `PENDING` status, so duplicate webhook retries do not double-credit the wallet.

### 3. Preventing Revenue Loss from Abandoned Carts
**Challenge**: Users holding court slots without paying, blocking legitimate customers.
**Solution**: Designed an automated booking expiry workflow. Pending bookings are assigned a configurable hold timer (10 minutes by default). A backend background process periodically checks for expired, unpaid bookings and safely reverts the associated `CourtAvailability` records to `available`.

## Engineering Highlights
- **Backend**: TypeScript-based REST API, modular NestJS architecture, robust error handling, and transactional database operations.
- **Frontend**: Client-side state management with Zustand, efficient server-state caching with React Query, and responsive charting with Recharts.
- **Database**: Normalized relational design in PostgreSQL ensuring high data integrity.

## What I Learned
This project solidified my understanding of transactional safety in distributed web applications. Integrating Stripe webhooks taught me the critical importance of idempotency in financial transactions. Furthermore, building the analytics dashboard improved my skills in writing complex SQL aggregations via Prisma and visualizing them efficiently on the frontend.

---

## 📄 Resume Bullet Points

- **Built a full-stack sports venue booking platform** using Next.js, NestJS, Prisma, PostgreSQL, and TypeScript, serving customer reservations and admin operations.
- **Implemented Stripe Checkout wallet top-up** with idempotent webhook handling to ensure accurate financial transactions and prevent double-crediting.
- **Designed a transaction-safe booking engine** with automated expiry logic (10-minute hold) that atomically releases unpaid reserved slots, reducing revenue loss from abandoned checkouts.
- **Developed a Recharts-powered analytics dashboard** tracking revenue trends, bookings per day, court utilization, peak hours, and payment sources.
- **Built an admin manual QR payment proof approval workflow**, enabling localized payment methods alongside an automated digital wallet system.
- **Integrated JWT authentication, Google Sign-In, and role-based access control** ensuring secure data isolation between customers and administrators.
- **Deployed via GitHub-triggered deployments**, hosting the frontend on Vercel, the backend API on Railway, and the PostgreSQL database on Supabase.

---

## 🎤 Interview Explanation Script

*"For my Repok project, I built an end-to-end booking platform to solve the operational bottlenecks of a local pickleball club. The architecture is split between a Next.js frontend and a NestJS backend connected to a Supabase PostgreSQL database.* 

*One of the core challenges I solved was booking concurrency and payment reliability. To prevent double-booking, I wrapped the booking creation in Prisma transactions. To handle payments, I built a digital wallet system where users can top-up via Stripe. I engineered the Stripe webhook handler to be idempotent: it credits the wallet only from a stored order and only if the order is still marked as pending, meaning even if Stripe retries the webhook, the database prevents the user from being credited twice.*

*I also built a background expiry system. If a user reserves a court but doesn't pay within the 10-minute hold window, the system automatically frees up those slots for other customers, maximizing venue utilization. On the admin side, I developed a comprehensive dashboard using Recharts to visualize revenue and peak hour trends."*
