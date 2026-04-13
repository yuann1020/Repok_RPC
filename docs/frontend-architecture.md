# Frontend Architecture Plan: Premium Pickleball Booking Web App

Based on the established NestJS/Prisma backend capabilities, here is the robust, precise architectural flow map intended to deploy the Next.js React application cleanly to match our REST APIs.

## 1. Frontend Folder Structure
Leveraging modern Next.js 14+ App Router paradigms natively.
```text
frontend/src/
├── app/                  <-- App Router pages & server/client layouts
│   ├── (public)/         <-- Grouped routing for /, /login, /register
│   ├── (customer)/       <-- Grouped core customer pipelines (/courts, /bookings)
│   └── (admin)/          <-- Grouped secure back-office pipelines (/admin/..)
├── components/           
│   ├── ui/               <-- Granular reusable elements (Buttons, Glassmorphism Cards)
│   ├── shared/           <-- Dynamic Navbars, Footers
│   └── admin/            <-- Heavy data-grid tables
├── lib/
│   ├── api/              <-- Feature-based API clients (auth, bookings, etc.)
│   └── utils.ts          <-- Standard Tailwind-merge formatters
├── hooks/                <-- Custom reusable React logic (e.g. useAuth, useBookingTracker)
├── types/                <-- Strict TS bindings natively mirroring Prisma backend payloads
└── store/                <-- Zustand centralized global configurations
```

## 2. Route & Page Structure

### Public Routes
- `/` ➔ *Landing Page (Hero, Court Categories Showcase, Features)*
- `/login` ➔ *Authentication Login Portal*
- `/register` ➔ *Authentication Registration Portal*

### Customer-Facing Secure Routes
- `/courts` ➔ *View list of all available courts.*
- `/courts/[id]` ➔ *Detailed court view & embedded availability tracking timeline.*
- `/bookings` ➔ *Personal management displaying historic/upcoming bookings.*
- `/bookings/[id]` ➔ *Deep detail view of a single specific booking.*
- `/payments/[bookingId]` ➔ *Mock manual payment gateway strictly locking transactions.*

### Secure Admin Environment Limits
- `/admin` ➔ *Quick Statistics & Analytics Overview.*
- `/admin/courts` ➔ *Manage lists, update pricing limits, modify status flags.*
- `/admin/availabilities` ➔ *Mass-generate targeted slots & trigger Maintenance exclusions.*
- `/admin/bookings` ➔ *Master table viewing cross-sectional reservations system-wide.*
- `/admin/payments` ➔ *Global transaction trackers isolating FAILED vs PAID loops.*

## 3. Shared Layout/Component Plan
- **Aesthetic Definition**: Premium, Sporty, Dark-Themed. Heavy utilization of Glassmorphism (blur backdrops) on cards to simulate high-end club exclusivity.
- **Root Layouts**: 
  - `CustomerLayout`: Sticky transparent headers, user-dropdown overlay, dynamic visual hero backgrounds.
  - `AdminLayout`: Locked Sidebar dashboard natively prioritizing dense numerical visualization and deep filtering.
- **Core Atomic Components**:
  - `DynamicSlotGrid`: The core 1-hour slot picker visualizing gaps mathematically mapped against booked availability states.
  - `CourtCard`: Premium presentational element exposing internal `facilities` array gracefully.

## 4. Feature-Based API Layer
Separating core API calls into structured feature files inside `lib/api/` scaling properly alongside Axios JWT interceptors:
- `auth.api.ts`
- `courts.api.ts`
- `availability.api.ts`
- `bookings.api.ts`
- `payments.api.ts`
- `admin.api.ts`

## 5. State Management
- **Transient UI State (Zustand)**: Strictly constrained to lightweight temporary session contexts, Auth token scopes, and multi-step temporary booking selections implicitly.
- **Backend Data Caching (React Query)**: **TanStack React Query** inherently handles the absolute source of truth fetching backend pipelines automatically handling optimistic updates, caching, and auto-invalidation explicitly.

## 6. Execution Build Order
1. **Frontend Foundation**: Spin Next.js structurally, configure Tailwind themes securely establishing the exact premium dark vectors.
2. **Login Portal**: Configure `auth.api.ts` natively bounding initial security access.
3. **Register Portal**: Expanding auth mappings securely mapping new users.
4. **Court Listing** (`/courts`): Simplest Read abstraction testing global API links.
5. **Court Detail + Availability** (`/courts/[id]`): Mapping the complex slot matrix constraints safely tracking.
6. **Booking Flow**: Finalizing strict sequential payload configurations dynamically.
7. **My Bookings** (`/bookings`): Displaying historical bounds natively.
8. **Payment Page** (`/payments/[bookingId]`): Completing the transaction lifecycle mechanically.
9. **Admin Pages later**: Deprioritized backend table abstractions reserved cleanly for stage execution recursively.
```
The /payments/[bookingId] page is complete.

Now implement the /bookings page and booking dashboard integration only.

Requirements:
- build only the customer bookings dashboard first
- use the existing backend endpoint:
  - GET /bookings
- optionally support navigating into:
  - /bookings/[id]
  - /payments/[bookingId]
- create a premium dark sporty page that shows:
  - booking reference
  - court name(s)
  - selected time slot(s)
  - total amount in MYR
  - booking status
  - payment status
  - booked date
- include loading state
- include empty state when the user has no bookings
- use React Query for fetching
- keep the UI clean and portfolio-ready
- include clear status badges for:
  - PENDING
  - CONFIRMED
  - CANCELLED
  - PAID
  - FAILED
  - UNPAID
- if a booking is unpaid or failed, provide a clean action to go to /payments/[bookingId]
- if a booking is confirmed/paid, show a completed state cleanly
- do not implement admin pages yet
- do not overbuild filtering unless it is very simple

When finished, show me:
1. final created/updated files
2. how the /bookings page flow works
3. how unpaid/failed bookings route back to payment
4. what page should be implemented next after /bookings