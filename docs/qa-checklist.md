# Frontend QA Checklist

> **Prerequisites:**
> - Backend running on `http://localhost:3001`
> - Frontend running on `http://localhost:3000`
> - At least 1 CUSTOMER user registered
> - At least 1 ADMIN user promoted (via `scripts/promote-admin.ts`)
> - At least 1 court created via admin
> - Availability slots generated for at least 1 court + date

---

## 1. Public / Auth Flow

### 1.1 Landing Page (`/`)
- [ ] Page loads without errors
- [ ] "Repok Pickleball" heading renders with gradient styling
- [ ] No navbar/sidebar — clean centered layout

### 1.2 Register (`/register`)
- [ ] Page loads inside centered card layout
- [ ] All 4 fields render: Full Name, Email, Password, Phone Number
- [ ] Submit with empty fields → shows client-side validation error
- [ ] Submit with duplicate email → shows backend error cleanly
- [ ] Submit with valid data → redirects to `/login`
- [ ] Button shows "CREATING..." during request
- [ ] No console errors

### 1.3 Login (`/login`)
- [ ] Page loads inside same centered card layout as register
- [ ] Email + Password fields render
- [ ] Submit with empty fields → shows client-side validation error
- [ ] Submit with wrong credentials → shows backend error (e.g. "Unauthorized")
- [ ] Submit with valid CUSTOMER credentials → redirects to `/courts`
- [ ] Submit with valid ADMIN credentials → redirects to `/admin`
- [ ] Button shows "AUTHENTICATING..." during request
- [ ] Token stored in `localStorage` (check DevTools → Application → Local Storage → `auth_token`)
- [ ] No console errors

---

## 2. Customer Flow

### 2.1 Court Listing (`/courts`)
- [ ] Page loads with customer header ("REPOK APP")
- [ ] Court cards render correctly with: name, category, price, courtType, facilities
- [ ] CHAMPIONSHIP courts have gold/amber border styling
- [ ] STANDARD courts have green hover glow
- [ ] Category filter dropdown works (filters visually + re-fetches)
- [ ] Status filter dropdown works
- [ ] Both filters combined work correctly
- [ ] Empty state shows when no courts match filters
- [ ] Loading spinner shows during fetch
- [ ] Clicking a court card navigates to `/courts/[id]`
- [ ] No console errors

### 2.2 Court Detail + Availability (`/courts/[id]`)
- [ ] Page loads with full court info: name, category, price, courtType, facilities, status
- [ ] CHAMPIONSHIP vs STANDARD has distinct color theming
- [ ] Date picker defaults to today
- [ ] Changing date clears selected slots and re-fetches availability
- [ ] Available slots render as clickable buttons with time labels
- [ ] Unavailable slots are greyed out, strikethrough, not clickable
- [ ] Clicking an available slot highlights it green with checkmark
- [ ] Clicking a selected slot deselects it
- [ ] Bottom checkout bar appears when ≥1 slot selected
- [ ] Bottom bar shows correct hour count
- [ ] Empty state shows if no slots exist for selected date
- [ ] Loading skeleton shows during fetch
- [ ] No console errors

### 2.3 Booking Submission (from `/courts/[id]`)
- [ ] Select valid consecutive slots → click "PROCEED TO CHECKOUT"
- [ ] Button shows "PROCESSING..." during request
- [ ] Successful booking → redirects to `/payments/[bookingId]`
- [ ] Select non-consecutive slots → submit → backend error displays in red bar
- [ ] Select only 1 slot after 5 PM → submit → minimum 2-hour rule error displays
- [ ] Select an already-booked slot (if possible) → unavailable error displays
- [ ] Error bar auto-clears when clicking a new slot
- [ ] No console errors

### 2.4 Payment Page (`/payments/[bookingId]`)
- [ ] Page loads with booking summary: reference, slots, court name, date, time ranges
- [ ] Total amount displays correctly in MYR
- [ ] Status badges show PENDING / UNPAID
- [ ] "INITIATE SECURE CHECKOUT" button visible for unpaid booking
- [ ] Click initiate → button shows loading → mock gateway appears
- [ ] Mock gateway shows "MOCK SUCCESS ✓" and "MOCK FAIL ✖" buttons
- [ ] Click MOCK SUCCESS → UI refreshes to confirmed state with checkmark
- [ ] Booking status updates to CONFIRMED, payment to PAID
- [ ] "VIEW MY BOOKINGS" button appears and works
- [ ] **Test FAIL path:** Create another booking, initiate, click MOCK FAIL
- [ ] Failed state shows error message + re-initiate path
- [ ] No console errors

### 2.5 My Bookings Dashboard (`/bookings`)
- [ ] Page loads with list of user's bookings
- [ ] Each booking card shows: reference, court name(s), slot times, total amount, status badges
- [ ] CONFIRMED/PAID bookings show green badges, no "PAY NOW" button
- [ ] PENDING/UNPAID bookings show "PAY NOW" button linking to `/payments/[id]`
- [ ] FAILED payment bookings show "PAY NOW" button
- [ ] CANCELLED bookings show red badge
- [ ] "DETAILS" button links to `/bookings/[id]`
- [ ] Empty state shows when user has no bookings + "BROWSE COURTS" link
- [ ] Loading spinner shows during fetch
- [ ] No console errors

### 2.6 Booking Detail (`/bookings/[id]`)
- [ ] Page loads with full booking detail
- [ ] Back button (←) works
- [ ] Slot cards show court name, date, time range
- [ ] Booking date and total amount display correctly
- [ ] Status badges render with correct colors
- [ ] UNPAID/FAILED → "EXECUTE PAYMENT" button links to `/payments/[id]`
- [ ] PENDING/CONFIRMED → "CANCEL BOOKING" button visible
- [ ] Cancel button triggers confirmation dialog
- [ ] Confirming cancel → booking status updates to CANCELLED
- [ ] CONFIRMED + PAID → shows "Transaction Globally Verified" message
- [ ] No console errors

---

## 3. Admin Flow

> **Prerequisite:** Log in with an ADMIN account.

### 3.1 Admin Dashboard (`/admin`)
- [ ] Sidebar renders with navigation links
- [ ] 4 overview cards render: Courts, Availabilities, Bookings, Payments
- [ ] All 4 cards link to correct routes
- [ ] Hover effects work (scale + green border)
- [ ] "Terminate Session" button works → clears auth → redirects to login
- [ ] No console errors

### 3.2 Admin Courts (`/admin/courts`)
- [ ] Table loads with existing courts
- [ ] Columns: Court Info (name + facilities), Parameters (category + courtType), Price, Status, Manage
- [ ] Status badges color-coded correctly
- [ ] "Configure" button opens inline form pre-filled with court data
- [ ] Edit form updates → submits → table refreshes with changes
- [ ] "+ Create New Court" button opens blank form
- [ ] Fill form → submit → new court appears in table
- [ ] Facilities field accepts comma-separated values
- [ ] Backend validation errors display in form
- [ ] Empty state shows when no courts exist
- [ ] Loading state works
- [ ] No console errors

### 3.3 Admin Availabilities (`/admin/availabilities`)
- [ ] Court selector dropdown populates with all courts
- [ ] No court selected → prompt message shows
- [ ] Select a court → two panels appear (generator + viewer)
- [ ] **Generator panel:**
  - [ ] Fill start date, end date → click "GENERATE ARRAYS"
  - [ ] Button shows loading state
  - [ ] Success alert fires
  - [ ] Optional base price field works
  - [ ] Backend errors display (e.g. duplicate dates)
- [ ] **Viewer panel:**
  - [ ] Date picker defaults to today
  - [ ] Slot cards render with time, status badge, price
  - [ ] Available slots show "Block ✕" button
  - [ ] Blocked slots show red styling + "Restore ✓" button
  - [ ] Click "Block" → slot becomes blocked (red) after refetch
  - [ ] Click "Restore" → slot becomes available (green) after refetch
  - [ ] Empty state shows when no slots for selected date
  - [ ] Changing date re-fetches slots
- [ ] No console errors

### 3.4 Admin Bookings (`/admin/bookings`)
- [ ] Table loads with all system bookings
- [ ] Columns: Reference, Customer, Court, Date, Amount, Status, Payment, Inspect
- [ ] Status filter dropdown works
- [ ] Court filter dropdown populates from courts
- [ ] Date filter works
- [ ] "Clear All" button resets all filters
- [ ] "Expand" button opens inline detail panel below table
- [ ] Detail panel shows: customer info, statuses, total, booked slots
- [ ] "Collapse" / "✕" closes detail panel
- [ ] Empty state shows when no bookings match filters
- [ ] Loading spinner works
- [ ] No console errors

### 3.5 Admin Payments (`/admin/payments`)
- [ ] Table loads with all system payments
- [ ] Columns: Payment ID, Booking Ref, Amount, Currency, Provider, Status, Paid At, Inspect
- [ ] Status filter dropdown works (UNPAID/PAID/FAILED/REFUNDED)
- [ ] Record count shows
- [ ] "Clear ✕" resets filter
- [ ] "Detail" button opens inline detail panel
- [ ] Detail panel shows: amount, status, provider, created date
- [ ] Linked booking section shows booking reference, customer, status, total
- [ ] Empty state shows when no payments match filter
- [ ] Loading spinner works
- [ ] No console errors

---

## 4. Route Protection

- [ ] Visit `/admin` while logged in as CUSTOMER → should redirect to `/login`
- [ ] Visit `/admin/courts` as CUSTOMER → should redirect to `/login`
- [ ] Visit `/admin/bookings` as CUSTOMER → should redirect to `/login`
- [ ] Visit `/admin/payments` as CUSTOMER → should redirect to `/login`
- [ ] Visit `/admin` while not logged in → should redirect to `/login`
- [ ] Visit `/courts` while not logged in → page loads (no guard currently, but API calls should 401)
- [ ] Visit `/bookings` while not logged in → API calls fail with 401, check behavior

---

## 5. Refresh / Session Persistence

- [ ] Log in as CUSTOMER → refresh page → check if token persists in localStorage
- [ ] After refresh, does `user` state (role, email) restore in Zustand? (**Known gap:** likely not — only token persists, user object is lost on refresh)
- [ ] After refresh, do authenticated API calls still work? (token interceptor reads from localStorage)
- [ ] Log in as ADMIN → refresh `/admin` page → does the page still render or redirect to login?
- [ ] Clear localStorage manually → refresh → verify user is effectively logged out
- [ ] After logout, verify localStorage is cleared and all auth state is reset

---

## 6. Edge Cases & Error States

### API Connectivity
- [ ] Stop the backend → visit `/courts` → loading spinner then error state
- [ ] Stop the backend → submit login → error message displays

### Empty Data
- [ ] New user with zero bookings → `/bookings` shows empty state
- [ ] Court with zero availability slots for a date → `/courts/[id]` shows empty state
- [ ] Admin with no courts created → `/admin/courts` shows empty row message
- [ ] Admin with no bookings → `/admin/bookings` shows empty state
- [ ] Admin with no payments → `/admin/payments` shows empty state

### Concurrent / Conflict
- [ ] Two tabs booking the same slot → second should fail with "already booked" error
- [ ] Cancel a confirmed booking → verify availability slots are released (check admin viewer)

---

## Priority Issues to Watch For

| Area | Likely Issue |
|------|-------------|
| Session hydration | `user` object lost on refresh — only token survives |
| Admin guard | May flash content briefly before redirect on slow connections |
| Customer navbar | No logout button or navigation links in customer layout yet |
| Public landing | No links to `/login` or `/register` from `/` |
| API field names | Backend response shape may differ from frontend expectations (e.g. `access_token` vs `accessToken`) |
