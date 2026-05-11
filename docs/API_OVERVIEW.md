# API Overview

This document summarizes the core REST API endpoints implemented in the Repok backend. Note that the backend does not use a global `/api` prefix. The frontend API client points directly to the backend root URL (e.g., `http://localhost:3001`).

## Authentication
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `POST` | `/auth/register` | No | - | Register a new user |
| `POST` | `/auth/login` | No | - | Authenticate and receive JWT |
| `POST` | `/auth/google-signin` | No | - | Authenticate via Google OAuth |

## Courts & Availability
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `GET` | `/courts` | No | - | List all active courts |
| `GET` | `/courts/:id` | No | - | Get specific court details |
| `GET` | `/availability` | No | - | Get available time slots for a specific date and court |

## Bookings
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `POST` | `/bookings` | Yes | Customer | Create a new pending booking |
| `GET` | `/bookings` | Yes | Customer | List current user's bookings |
| `GET` | `/bookings/:id` | Yes | Customer | Get booking details |
| `POST` | `/bookings/:id/pay-with-wallet` | Yes | Customer | Pay for a booking using wallet credits |

*Example Booking Payload:*
```json
{
  "courtId": "uuid-string",
  "availabilityIds": ["uuid-1", "uuid-2"]
}
```

## Wallet
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `GET` | `/wallet` | Yes | Customer | Get user's wallet balance |
| `GET` | `/wallet/transactions` | Yes | Customer | Get user's wallet transaction history |
| `POST` | `/wallet/top-ups/stripe-checkout` | Yes | Customer | Initiate Stripe checkout for top-up |
| `GET` | `/wallet/top-ups/:id` | Yes | Customer | Get a specific top-up order status |

## Payments & Webhooks
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `POST` | `/payments/:bookingId/initiate` | Yes | Customer | Initiate a payment for a booking |
| `GET` | `/payments/booking/:bookingId` | Yes | Customer | Get payment details by booking ID |
| `POST` | `/payments/:id/proof` | Yes | Customer | Submit manual QR payment proof |
| `POST` | `/payments/:id/fail` | Yes | Customer | Mark a payment as failed by customer |
| `POST` | `/payments/stripe/webhook` | No | - | Stripe Webhook listener (Validates Stripe signature) |

## Admin - Management
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `POST` | `/admin/courts` | Yes | Admin | Create a new court |
| `POST` | `/admin/availability/generate` | Yes | Admin | Batch generate timeslots |
| `GET` | `/admin/payments` | Yes | Admin | List payments (can be filtered to pending review) |
| `POST` | `/admin/payments/:id/review` | Yes | Admin | Review (approve/reject) a manual payment |

## Admin - Analytics
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `GET` | `/admin/analytics/summary` | Yes | Admin | Returns KPI metrics, charts, bookingsByDay, revenue sources, court utilization, peak hour, wallet metrics, and selectedRange |

## Announcements
| Method | Route | Auth? | Role | Purpose |
|--------|-------|-------|------|---------|
| `GET` | `/announcements` | No | - | Fetch active announcements |
| `POST` | `/admin/announcements` | Yes | Admin | Create a new announcement |
