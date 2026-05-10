# Stripe Wallet Local Setup

Local ports:
- http://localhost:3000 = frontend website
- http://localhost:3001 = backend API
- Stripe webhook goes to backend: localhost:3001/payments/stripe/webhook
- Stripe success/cancel redirects go to frontend: localhost:3000/wallet/top-up/...

Local Stripe webhook test:
1. Start backend on port 3001.
2. Start frontend on port 3000.
3. Run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3001/payments/stripe/webhook
   ```
4. Copy the printed whsec_... value into backend/.env:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Restart backend.
6. Go to:
   ```text
   http://localhost:3000/wallet/top-up
   ```
7. Complete checkout using Stripe test card:
   ```text
   4242 4242 4242 4242
   Any future expiry
   Any CVC
   ```
8. Confirm wallet balance updates only after webhook success.

Custom wallet top-up:
- Fixed packages still work: RM50, RM100, RM200, RM500.
- Custom top-ups accept whole RM amounts from RM10 to RM2000.
- Custom top-ups do not include bonus credits.
- The backend validates the amount again before creating Stripe Checkout.

Booking hold expiry:
1. Use the default local hold time:
   ```bash
   BOOKING_HOLD_MINUTES=10
   ```
2. For a quick local expiry test, temporarily set:
   ```bash
   BOOKING_HOLD_MINUTES=1
   ```
3. Restart the backend after changing the value.
4. Create a booking and leave it unpaid.
5. Confirm the payment page countdown reaches zero, the booking becomes expired, and the slots become available again.
6. Reset `BOOKING_HOLD_MINUTES=10` after testing.
