# Architecture Documentation

## 1. Overall System Architecture

```mermaid
graph TD
    subgraph Client Tier
        Mobile[Mobile Browser]
        Desktop[Desktop Browser]
    end

    subgraph Presentation Tier [Vercel]
        NextJS[Next.js 14 Frontend]
        ReactQuery[React Query - Caching]
        Zustand[Zustand - State]
    end

    subgraph Application Tier [Railway]
        NestJS[NestJS API Server]
        AuthGuard[JWT Auth & RBAC]
        BookingEngine[Booking Service]
        PaymentProcessor[Payment Service]
        AdminAnalytics[Analytics Service]
    end

    subgraph Data Tier [Supabase]
        PostgreSQL[(PostgreSQL Database)]
    end

    subgraph External Services
        Stripe[Stripe Checkout & Webhooks]
        Google[Google OAuth]
        SMTP[Nodemailer / Gmail SMTP]
    end

    Mobile -->|HTTPS| NextJS
    Desktop -->|HTTPS| NextJS
    NextJS -->|REST API| NestJS
    NestJS --> AuthGuard
    AuthGuard --> BookingEngine
    AuthGuard --> PaymentProcessor
    AuthGuard --> AdminAnalytics
    NestJS <-->|Prisma ORM| PostgreSQL
    PaymentProcessor <--> Stripe
    AuthGuard <--> Google
    NestJS --> SMTP
```

## 2. Customer Booking Sequence

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant API
    participant Database

    Customer->>Frontend: Select Date & Slots
    Frontend->>API: POST /bookings
    API->>Database: BEGIN Transaction
    API->>Database: Check Slot Availability
    alt Slots Available
        API->>Database: Mark Slots Reserved
        API->>Database: Create Booking Record
        API->>Database: COMMIT Transaction
        API-->>Frontend: 201 Created (Booking ID)
        Frontend-->>Customer: Redirect to Checkout (Timer Starts)
    else Slots Unavailable
        API->>Database: ROLLBACK Transaction
        API-->>Frontend: 400 Bad Request
        Frontend-->>Customer: Show Error "Slots taken"
    end
```

## 3. Stripe Wallet Top-Up & Idempotency Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant API
    participant Stripe
    participant Database

    Customer->>Frontend: Select Top-up Amount
    Frontend->>API: POST /wallet/top-ups/stripe-checkout
    API->>Database: Create Pending TopUpOrder
    API->>Stripe: Create Checkout Session
    Stripe-->>API: Session URL
    API-->>Frontend: Return Session URL
    Frontend-->>Customer: Redirect to Stripe

    Customer->>Stripe: Complete Payment
    Stripe-->>Customer: Redirect to Success Page

    Note over Stripe, API: Asynchronous Webhook
    Stripe->>API: POST Webhook (checkout.session.completed)
    API->>Database: Check TopUpOrder Status
    alt Status != PENDING
        API-->>Stripe: 200 OK (Ignore, already processed)
    else Status == PENDING
        API->>Database: BEGIN Transaction
        API->>Database: Update TopUpOrder Status to PAID
        API->>Database: Add Credits to Wallet
        API->>Database: Create WalletTransaction
        API->>Database: COMMIT Transaction
        API-->>Stripe: 200 OK
    end
```

## 4. Booking Expiry Flow

```mermaid
sequenceDiagram
    participant Cron as Background Task / Expiry Service
    participant Database

    Cron->>Database: Query Bookings (Status: PENDING, Time > 10m ago)
    loop For each expired booking
        Cron->>Database: BEGIN Transaction
        Cron->>Database: Update Booking Status to EXPIRED/CANCELLED
        Cron->>Database: Free up CourtAvailability slots
        Cron->>Database: COMMIT Transaction
    end
```

## 5. Manual QR Payment Approval Sequence

```mermaid
sequenceDiagram
    actor Customer
    actor Admin
    participant Frontend
    participant API
    participant Database

    Customer->>Frontend: Upload QR Receipt
    Frontend->>API: POST /payments/:id/proof
    API->>Database: Update Payment (Status: PENDING_REVIEW)
    API-->>Frontend: Success

    Admin->>Frontend: View Pending Payments
    Frontend->>API: GET /admin/payments
    API-->>Frontend: List of Payments

    Admin->>Frontend: Click "Approve"
    Frontend->>API: POST /admin/payments/:id/review (decision: APPROVE)
    API->>Database: Update Payment (Status: PAID)
    API->>Database: Update Booking (Status: CONFIRMED)
    API-->>Frontend: Success
```

## 6. Folder Structure & Separation of Concerns

- `/frontend` (Next.js Application)
  - `/src/app`: App Router structure, segregated into `(admin)` and customer-facing routes.
  - `/src/components`: Reusable UI components.
  - `/src/lib/api`: API client configuration with direct backend mapping.
  - `/src/providers`: React Query and Context providers.
  - `/src/store`: Zustand state slices.
- `/backend` (NestJS Application)
  - `/src/admin`: Admin specific logic and analytics.
  - `/src/bookings`: Booking orchestration.
  - `/src/courts`: Court management.
  - `/src/payment`: Stripe and Manual payment handling.
  - `/src/wallet`: Wallet top-up and deduction logic.
- `/prisma` (Database Schema and Migrations)
  - `/prisma/schema.prisma`
  - `/prisma/migrations`
  - `/prisma/seed.ts`

## 7. Security Boundaries
- **Frontend vs Backend**: The frontend holds no secrets. All environment variables containing secrets (e.g., Stripe Keys, DB URLs) strictly exist on the backend server.
- **Client vs Admin**: API routes prefixed with `/admin` require a JWT containing the `ADMIN` role. The frontend mirrors this by restricting view access to admin components.
- **Idempotency**: Webhook logic strictly verifies transaction status before crediting, preventing malicious or accidental repeated network requests from inflating a user's wallet.
