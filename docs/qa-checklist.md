# Repok System QA Checklist

> **Prerequisites:**
> - Backend running on `http://localhost:3001`
> - Frontend running on `http://localhost:3000`
> - At least 1 CUSTOMER user registered
> - At least 1 ADMIN user promoted
> - At least 1 court created via admin
> - Availability slots generated for at least 1 court + date

---

## 1. Public / Auth Flow

### 1.1 Landing Page (`/`)
- [ ] Page loads without errors
- [ ] "Repok Pickleball" heading renders with gradient styling

### 1.2 Register & Login (`/register`, `/login`)
- [ ] Register with valid data → redirects to `/login`
- [ ] Google Sign-In button correctly initiates OAuth flow
- [ ] Login with valid CUSTOMER credentials → redirects to `/courts`
- [ ] Login with valid ADMIN credentials → redirects to `/admin`
- [ ] Token stored in `localStorage` (`auth_token`)

---

## 2. Customer Flow

### 2.1 Court Browsing & Detail (`/courts`, `/courts/[id]`)
- [ ] Courts render correctly with name, category, pricing, and availability.
- [ ] Category and Status filters work properly
- [ ] Date picker defaults to today; changing date re-fetches availability
- [ ] Available slots highlight when clicked; unavailable slots are disabled
- [ ] Bottom checkout bar calculates total cost correctly

### 2.2 Booking Submission & Payment (`/payments/[bookingId]`)
- [ ] Submitting consecutive slots creates booking and navigates to payment
- [ ] Booking hold timer (default 10 mins) starts
- [ ] **Wallet Payment**: If balance is sufficient, "Pay with Wallet" immediately confirms booking
- [ ] **Manual QR Payment**: Selecting QR displays instructions. Uploading receipt changes status to `PENDING_REVIEW`
- [ ] Expiry test: Wait 10 minutes without paying, verify booking expires and slots are freed
- [ ] Confirm booking confirmation email is dispatched after payment

### 2.3 Wallet & Top-Up (`/wallet`)
- [ ] Wallet page shows correct balance and transaction history
- [ ] Click "Top Up" → select RM50 package → redirects to Stripe Checkout
- [ ] Select "Custom Amount" (e.g., RM25) → redirects to Stripe Checkout
- [ ] After successful Stripe payment, verify wallet balance increases (webhook handled correctly)
- [ ] Verify idempotency: Simulating a duplicate webhook does not double-credit wallet

### 2.4 My Bookings Dashboard (`/bookings`, `/bookings/[id]`)
- [ ] Lists all user bookings
- [ ] Statuses update correctly (PENDING, CONFIRMED, EXPIRED)
- [ ] PENDING bookings allow resuming payment
- [ ] Cancel button works for CONFIRMED bookings

---

## 3. Admin Flow

> **Prerequisite:** Log in with an ADMIN account.

### 3.1 Admin Dashboard & Analytics (`/admin`)
- [ ] Analytics summary cards load (Revenue, Bookings, etc.)
- [ ] Recharts graphs (Revenue Trends, Court Utilization, Peak Hours) render properly
- [ ] Changing the month filter updates the charts based on `PAID` payments

### 3.2 Court & Availability Management (`/admin/courts`, `/admin/availabilities`)
- [ ] Create, edit, and configure courts
- [ ] Generate time slots for specific date ranges
- [ ] Block/Restore specific slots manually

### 3.3 Payment Review Queue (`/admin/payments`)
- [ ] View list of payments, filterable by `PENDING_REVIEW`
- [ ] Click into a manual payment to review uploaded receipt image
- [ ] Click "Approve" → updates payment to `PAID`, booking to `CONFIRMED`
- [ ] Click "Reject" → updates payment to `FAILED`, booking remains `PENDING` (or handled appropriately)
- [ ] Verify approval triggers the booking confirmation email

### 3.4 Announcements (`/admin/announcements`)
- [ ] Create announcement and verify it appears on the customer dashboard
