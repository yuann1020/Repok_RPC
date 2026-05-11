# Project Report: Repok Pickleball Court Booking System

## 1. Introduction
The Repok Pickleball Court Booking System is a comprehensive web-based platform designed to digitize and streamline the operations of a pickleball facility. It replaces manual booking and payment processes with a fully automated, user-friendly digital system.

## 2. Objectives
- Eliminate double-bookings and manual administrative tasks.
- Provide a frictionless booking and payment experience for customers.
- Implement a digital wallet to encourage customer retention and simplify micro-transactions.
- Equip administrators with actionable business intelligence through a real-time analytics dashboard.

## 3. Scope
The project covers both a customer-facing portal and a secure administrator dashboard. It includes user authentication, venue browsing, real-time booking, payment processing (Wallet + Manual QR + Stripe), booking confirmation emails, and administrative control over venues, slots, and financial reviews.

## 4. Target Users
- **Customers / Players:** Individuals looking to view court availability, top-up digital credits, and book courts seamlessly.
- **Facility Administrators:** Staff members who manage court schedules, verify localized payments, and review financial performance.

## 5. Functional Requirements
- **Auth:** Users must be able to register, log in natively, or use Google Sign-In.
- **Booking:** Users must select valid, consecutive time slots. Unpaid bookings must expire after a configurable hold time (default 10 minutes).
- **Payments:** Users can pay via Wallet credits. Wallets can be topped up via Stripe. Users can alternatively upload a QR payment receipt for manual approval.
- **Admin:** Admins can manage courts, approve/reject manual payments, and view analytics.

## 6. Non-Functional Requirements
- **Performance:** Fast page loads using Next.js edge caching and React Query.
- **Reliability:** Transaction-safe database operations to guarantee data integrity during concurrent bookings.
- **Security:** Role-based JWT authentication. Secret keys kept off the client.

## 7. System Architecture
The application employs a decoupled architecture. 
- The **Frontend** is built with Next.js 14, utilizing Server Components where applicable, and Zustand/React Query for client-side state. 
- The **Backend** is a NestJS application providing a TypeScript-based REST API.
- The **Database** is PostgreSQL hosted on Supabase, interfaced via Prisma ORM.

## 8. Database Design Explanation
The database schema is highly relational:
- `User` maps to `Booking` and `Wallet`.
- `Court` has many `CourtAvailability` slots.
- `Booking` has many `BookingItem`s (representing reserved slots) and a 1-to-1 relationship with a `Payment` record.
- This normalized structure prevents data duplication and allows for complex aggregations (e.g., calculating revenue by joining Payments and Bookings).

## 9. Booking Algorithm Explanation
When a user requests slots, the backend initiates a Prisma database transaction. It verifies all requested `CourtAvailability` IDs are currently `isAvailable = true`. If true, they are marked `false` and a `Booking` is created. If any slot is taken, the entire transaction rolls back, preventing partial bookings. A scheduled process sweeps the database for bookings stuck in `PENDING` past their expiry window (10 minutes), reverting their slots back to available.

## 10. Payment Flow Explanation
- **Wallet Top-Up:** Handled via Stripe Checkout. The webhook credits the wallet only from a stored TopUpOrder and only if the order is still PENDING, so duplicate webhook retries do not double-credit the wallet.
- **Wallet Payment:** A database transaction deducts credits from the user's wallet and updates the booking status to `CONFIRMED`.
- **Manual Payment:** The user uploads an image, the booking is marked `PENDING_REVIEW`. An admin inspects the image via the dashboard and manually triggers the status update.

## 11. Admin Workflow & Analytics Explanation
Admins manage the core data (courts, slots) and review the manual payment queue. The analytics module aggregates data directly from PostgreSQL. It calculates "Real Revenue" by filtering for `PaymentStatus = PAID`. Recharts is used on the frontend to visualize these aggregations, allowing filtering by month.

## 12. Security Considerations
- **Authentication:** Passwords are hashed. JWTs are used for session management.
- **Authorization:** Backend endpoints have Guard decorators to ensure only users with the `ADMIN` role can access management routes.
- **Financial Integrity:** Idempotent webhook handling prevents double-crediting. Database transactions prevent race conditions during booking and wallet deductions.

## 13. Deployment Explanation
- **Frontend:** Deployed to Vercel, enabling Vercel-hosted frontend delivery.
- **Backend:** Hosted on Railway, running the containerized NestJS application.
- **Database:** PostgreSQL instance hosted securely on Supabase.

## 14. Testing Checklist
- [ ] User Registration & Google Auth.
- [ ] Court browsing and slot selection.
- [ ] Booking creation and atomic rejection of unavailable slots.
- [ ] 10-minute automatic booking expiry.
- [ ] Stripe Wallet top-up (Success and Webhook processing).
- [ ] Booking payment via Wallet credits.
- [ ] Manual QR proof upload and Admin approval.
- [ ] Admin chart rendering and month filtering.

## 15. Limitations & Future Enhancements
- **Current Limitations:** The system currently requires manual slot generation by admins rather than infinite recurring schedules.
- **Future Enhancements:** Implement automated recurring slot generation, a subscription tier for frequent players, and integration with physical smart locks for automated court access.

## 16. Conclusion
The Repok Booking System is a robust, deployment-ready portfolio application that automates the operational needs of a sports facility. By leveraging a modern TypeScript stack, it ensures data integrity, secure payments, and provides an excellent user experience for both customers and administrators.
