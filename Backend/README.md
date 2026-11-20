# KeylessFlow API

Backend for Ospite / KeylessFlow, the digital guest experience platform: booking and payments (Squad A), check-in and room access (Squad B), and guest services (Squad C). Built with Node.js, Express 5 and MongoDB (Mongoose).

## Getting started

```bash
npm install
cp .env.example .env     # set JWT_SECRET and PAYSTACK_SECRET_KEY
npm run seed             # sample rooms, recommendations, admin + staff accounts
npm run dev              # http://localhost:8080/api/v1
```

You need MongoDB running locally or a MongoDB Atlas URI in `MONGO_URI`. The database name comes from `DB_NAME` (default `keylessflow`).

Seeded accounts (dev only, override with `SEED_*` in `.env`):

| Role  | Email                    | Password      |
| ----- | ------------------------ | ------------- |
| Admin | `admin@keylessflow.test` | `Admin@12345` |
| Staff | `staff@keylessflow.test` | `Staff@12345` |

Get Paystack test keys from the Paystack dashboard under Settings → API Keys & Webhooks. Set the webhook URL there to `https://<your-host>/api/v1/payments/webhook`.

## Postman

Import [docs/KeylessFlow.postman_collection.json](docs/KeylessFlow.postman_collection.json). Then:

1. Check the `baseUrl` collection variable (default `http://localhost:8080/api/v1`).
2. Set `paystackSecretKey` to the same value as `PAYSTACK_SECRET_KEY`. It is used only to sign the simulated webhook.
3. Run the folders in order, or the whole collection in the Runner. Each request saves the IDs the next one needs, and every request has tests.

The collection walks the full MVP journey. To test a real Paystack checkout, open the `authorizationUrl` returned by *Initialize payment* and pay with test card `4084 0840 8408 4081` (CVV `408`, any future expiry, PIN `0000`, OTP `123456`). Then call *Verify payment*.

## Scripts

| Command        | What it does                              |
| -------------- | ----------------------------------------- |
| `npm run dev`  | Start with auto-reload (nodemon)          |
| `npm start`    | Start with plain Node (production)        |
| `npm run seed` | Load sample data. Safe to run repeatedly. |

## Project structure

```
server.js              Entry point: connects to MongoDB, starts the server and background jobs
app.js                 Express app: security headers, CORS, JSON, routes under /api/v1
config/                Environment variables and the MongoDB connection
models/                Guest, Staff, Room, Booking, Payment, CheckIn, AccessToken, AccessLog,
                       ServiceRequest, Recommendation, Notification
controllers/           Request handlers, one file per module
routes/                Route definitions, mounted in routes/index.js
services/              Paystack, availability, booking helpers, simulated ID check, notifications
jobs/                  Expires unpaid holds and sends abandoned-booking reminders
middlewares/           Auth (JWT + roles), rate limiting, 404 and error handling
scripts/seed.js        Sample data
docs/                  Postman collection
```

## Endpoints

All paths are under `/api/v1`. Access: **public** = no token, **guest** / **staff** / **admin** = Bearer token for that role. Admin can do everything staff can.

### Auth and accounts

| Method | Path                    | Access      | Purpose                           |
| ------ | ----------------------- | ----------- | --------------------------------- |
| POST   | `/auth/register`        | public      | Create a guest account            |
| POST   | `/auth/login`           | public      | Guest login                       |
| POST   | `/auth/staff/login`     | public      | Staff/admin login                 |
| GET    | `/auth/me`              | any         | Current account                   |
| PATCH  | `/auth/me`              | any         | Update own profile                |
| POST   | `/auth/change-password` | any         | Change password                   |
| GET    | `/guests`               | staff       | Search guests                     |
| GET    | `/guests/:id`           | staff       | Guest with recent bookings        |
| PATCH  | `/guests/:id`           | staff       | Update guest                      |
| DELETE | `/guests/:id`           | admin       | Delete guest (no active stays)    |
| GET    | `/staff`                | admin       | List staff                        |
| POST   | `/staff`                | admin       | Create staff account              |
| PATCH  | `/staff/:id`            | admin       | Update role, department, disable  |
| GET    | `/notifications`        | guest       | In-app notifications              |
| PATCH  | `/notifications/:id/read` | guest     | Mark one as read                  |
| PATCH  | `/notifications/read-all` | guest     | Mark all as read                  |

### Squad A: booking and payments

| Method | Path                                | Access       | Purpose                                          |
| ------ | ----------------------------------- | ------------ | ------------------------------------------------ |
| GET    | `/rooms`                            | public       | List rooms (`type`, `guests`, `minPrice`, `maxPrice`; admins can add `includeInactive=true`) |
| GET    | `/rooms/availability`               | public       | Free rooms for `checkInDate`/`checkOutDate`, with total price |
| GET    | `/rooms/:id`                        | public       | Room details (add dates to get `isAvailable`)    |
| POST   | `/rooms`, PATCH `/rooms/:id`        | admin        | Manage rooms                                     |
| POST   | `/bookings`                         | guest        | Create reservation (holds the room for 30 min)   |
| GET    | `/bookings`                         | guest, staff | Own bookings / all bookings with filters         |
| GET    | `/bookings/:reference`              | guest, staff | Booking with latest payment and check-in status  |
| GET    | `/bookings/:reference/confirmation` | guest, staff | Confirmation (409 until paid)                    |
| POST   | `/bookings/:reference/cancel`       | guest, staff | Cancel an unpaid booking                         |
| POST   | `/bookings/:reference/check-out`    | staff        | End the stay and revoke room keys                |
| POST   | `/payments/initialize`              | guest        | Start Paystack payment, returns `authorizationUrl` |
| GET    | `/payments/verify/:reference`       | guest, staff | Verify with Paystack after the redirect          |
| GET    | `/payments/:reference`              | guest, staff | Payment status                                   |
| POST   | `/payments/webhook`                 | Paystack     | Signed webhook (`x-paystack-signature`)          |
| GET    | `/admin/abandoned-bookings`         | staff        | Unpaid bookings eligible for a reminder          |
| POST   | `/admin/abandoned-bookings/nudge`   | admin        | Send reminders now (also runs every 5 min)       |

### Squad B: check-in and room access

| Method | Path                                         | Access       | Purpose                                  |
| ------ | -------------------------------------------- | ------------ | ---------------------------------------- |
| POST   | `/check-in`                                  | guest        | Start check-in with `bookingReference`   |
| GET    | `/check-in/:bookingReference`                | guest, staff | Check-in status and eligibility          |
| PATCH  | `/check-in/:bookingReference/details`        | guest        | Arrival time, guests, address, requests  |
| POST   | `/check-in/:bookingReference/verify-identity`| guest        | Simulated ID verification                |
| POST   | `/check-in/:bookingReference/verification`   | staff        | Record a manual verification result      |
| GET    | `/check-in`                                  | staff        | List check-ins by status                 |
| POST   | `/access/tokens`                             | guest, staff | Issue a digital room key (shown once)    |
| GET    | `/access/tokens`                             | guest, staff | List keys (no raw tokens)                |
| POST   | `/access/tokens/:tokenId/revoke`             | guest, staff | Revoke a key                             |
| GET    | `/access/logs`                               | guest, staff | Door access attempts                     |
| POST   | `/lock/validate`                             | public       | Simulated door lock: `{ token, roomNumber }` |

### Squad C: guest services

| Method | Path                                   | Access       | Purpose                                   |
| ------ | -------------------------------------- | ------------ | ----------------------------------------- |
| GET    | `/service-requests/categories`         | public       | Request categories                        |
| POST   | `/service-requests`                    | guest        | Submit a concierge request                |
| GET    | `/service-requests`                    | guest, staff | Own requests / all requests with filters  |
| GET    | `/service-requests/:reference`         | guest, staff | Track a request (with status history)     |
| PATCH  | `/service-requests/:reference/status`  | staff        | Move to `in_progress`, `completed`, `cancelled` |
| POST   | `/service-requests/:reference/cancel`  | guest        | Cancel a pending request                  |
| GET    | `/recommendations`                     | public/guest | All, or personalised with `bookingReference` |
| POST, PATCH, DELETE | `/recommendations[/:id]`  | admin        | Manage recommendations                    |

## Conventions shared by all squads

- **Auth:** `Authorization: Bearer <JWT>`. Tokens carry the account type (`guest` or `staff`). Staff have a role of `staff` or `admin`.
- **Responses:** success is `{ success: true, data, message?, pagination? }`. Errors are `{ success: false, message, details? }` with the matching HTTP status: 400 validation, 401 not logged in, 403 not allowed, 404 not found (also used for other guests' records), 409 wrong state or conflict, 422 identity check failed, 502 Paystack error.
- **IDs:** guests, rooms and staff use MongoDB ObjectIds. Bookings `KFB-XXXXXXXX`, payments `KFP-XXXXXXXX` (also the Paystack transaction reference), service requests `KFR-XXXXXXXX`.
- **Dates:** stays use `YYYY-MM-DD`. Timestamps are ISO 8601 in UTC. Amounts are in Naira and converted to kobo for Paystack.
- **Booking status:** `pending_payment` → `confirmed` → `checked_in` → `checked_out`, or `cancelled` / `expired`.
- **Booking payment status** (kept separate, per the PRD): `unpaid`, `paid`, `failed`, `refund_required`.
- **Payment status:** `pending`, `success`, `failed`.
- **Check-in status:** `initiated` → `details_submitted` → `verified`, or `verification_failed`.
- **Room key status:** `active`, `revoked`, `expired`.
- **Service request status:** `pending` → `in_progress` → `completed`, or `cancelled`.

## Proposed answers to the PRD's open questions

These are the defaults in the code. Most can be changed in `.env`. Confirm or change them at Day 1 planning.

| Question                              | Default                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| Full payment upfront?                 | Yes, the full stay amount in NGN.                                                     |
| Room inventory and pricing            | Sample data from `npm run seed`: 10 rooms across standard, deluxe, executive and suite. |
| Incomplete or failed payments         | The room is held for 30 min (`BOOKING_HOLD_MINUTES`). A failed payment can be retried within the hold. After it, the booking becomes `expired` and the room is freed. |
| Paid after the hold expired           | Confirmed if the room is still free. Otherwise the booking is cancelled and marked `refund_required`. |
| Notification channels                 | In-app only (`/notifications`). Email/SMS can be added in `services/notification.service.js`. |
| Abandonment reminders                 | Rule-based: unpaid for 15+ min, arrival not passed, not yet reminded, and no booking completed since. One per guest. |
| Identity information                  | ID type, ID number and name on the ID. Only the last 4 digits and a hash of the number are stored. |
| Simulated verification                | Name on the ID must match the booking. Formats: NIN 11 digits, passport 6-9 characters, licence 8-15 characters. IDs starting with `000` fail. 3 attempts, then staff verify at the desk. |
| Check-in eligibility                  | Booking confirmed and paid, from 48 hours before the check-in date (`CHECKIN_WINDOW_HOURS`) until check-out. |
| Room key validity                     | From issue until 12:00 Lagos time on the check-out date (`CHECKOUT_HOUR_UTC=11`). A new key revokes the old one. Check-out revokes all keys. |
| Request categories                    | Housekeeping, room service, maintenance, general assistance.                        |
| Who updates request statuses          | Staff and admin accounts.                                                            |
| Recommendations                       | 8 predefined items, filtered by room type, nights, weekend stays and stay stage.     |
| Authentication                        | JWT. Guests self-register. Staff accounts are created by an admin.                   |

## Not built yet

Loyalty points and promotions (Could Have), email/SMS delivery, refunds, booking changes, real identity providers and physical locks are left for later, as the PRD scopes them out of the 5-day MVP.
