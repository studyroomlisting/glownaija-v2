# GlowNaija — Complete Build
### Nigerian & Afro-Caribbean Beauty Marketplace — UK

Built by Nexova Technologies Ltd  
Stack: Next.js 14 App Router · Supabase (PostgreSQL + Auth + Storage) · Stripe · Resend · Anthropic Claude · Vercel

---

## Quick Start (5 steps)

```bash
# 1. Install dependencies
npm install

# 2. Run database migration
# → Go to supabase.com → your project → SQL Editor
# → Paste and run: supabase/migrations/001_initial_schema.sql

# 3. Configure Supabase
# → Storage → New bucket → name: "salon-images" → Public: ON
# → Authentication → Providers → Google → enable (add Client ID + Secret)
# → Authentication → URL Configuration → Site URL: http://localhost:3000
# → Add redirect URL: http://localhost:3000/auth/callback

# 4. Set environment variables
cp .env.local.example .env.local
# Fill in all values (see below)

# 5. Run
npm run dev
# Open http://localhost:3000

# Make yourself admin (in Supabase SQL Editor):
UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
```

---

## Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase.com → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | supabase.com → Project Settings → API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | stripe.com → Developers → API Keys |
| `STRIPE_SECRET_KEY` | stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | stripe.com → Developers → Webhooks |
| `RESEND_API_KEY` | resend.com → API Keys |
| `EMAIL_FROM` | e.g. `GlowNaija <hello@glownaija.co.uk>` |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (dev) or your domain |
| `CRON_SECRET` | Any random string — `openssl rand -hex 32` |

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars from `.env.local`
4. Add to Supabase Auth redirect URLs: `https://yourdomain.com/auth/callback`
5. Set Stripe webhook: `https://yourdomain.com/api/stripe-webhook`
6. Events with `stripe listen --forward-to localhost:3000/api/stripe-webhook` for local testing

---

## Project Structure

```
glownaija-next/
│
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx                # Root layout (metadata, fonts, Toaster)
│   ├── globals.css               # Design system (CSS vars, all utility classes)
│   ├── page.tsx                  # Homepage (9 sections)
│   ├── not-found.tsx             # 404 page
│   ├── sitemap.ts                # Auto-generated sitemap
│   │
│   ├── auth/                     # Auth pages (no header/footer)
│   │   ├── signin/               # Email + Google OAuth sign in
│   │   ├── signup/               # Role picker, strength bar, Google OAuth
│   │   ├── forgot-password/      # Password reset request
│   │   ├── reset-password/       # New password form
│   │   └── callback/route.ts     # Supabase OAuth callback
│   │
│   ├── (public)/                 # Pages with Header + Footer
│   │   ├── salons/               # Salon listing with city/service filters
│   │   ├── salon/[slug]/         # Salon detail, services, reviews, enquiry
│   │   ├── shop/                 # Product listing with category/search filters
│   │   ├── shop/[id]/            # Product detail, Add to Cart, Wishlist
│   │   ├── cart/                 # Cart page, coupon, free delivery progress
│   │   ├── checkout/             # Address form, order summary, Stripe redirect
│   │   ├── wishlist/             # Saved products
│   │   ├── order/                # Order detail
│   │   ├── events/               # Events listing
│   │   ├── events/[id]/          # Event detail + registration form
│   │   ├── events/create/        # Create event form
│   │   ├── events/[id]/dashboard/# Organiser dashboard + CSV export
│   │   ├── booking/              # Booking flow with slot picker
│   │   ├── booking/confirmation/ # Booking confirmed + pay deposit
│   │   ├── search/               # Cross-entity search (salons+products+events)
│   │   ├── category/[slug]/      # Browse by service type
│   │   ├── location/[slug]/      # Browse by city
│   │   ├── chat/                 # Glow AI chat (Claude claude-sonnet-4-6)
│   │   ├── stylist/              # AI Stylist quiz → salon match
│   │   ├── contact/              # Contact form
│   │   ├── privacy/              # Privacy policy
│   │   └── terms/                # Terms of service
│   │
│   ├── (protected)/              # Auth-required pages
│   │   ├── account/              # Customer account (5 tabs)
│   │   ├── dashboard/            # Salon owner dashboard (8 tabs)
│   │   ├── business/             # Register a salon
│   │   └── admin/                # Admin panel (7 tabs)
│   │
│   └── api/                      # API routes
│       ├── availability/         # GET — booking slot availability
│       ├── chat/                 # POST — Glow AI chat (Anthropic)
│       ├── check-duplicate/      # GET — salon name/email/phone duplicate check
│       ├── checkout/             # POST — create Stripe checkout session
│       ├── coupon-validate/      # GET — validate coupon code
│       ├── export-event/         # GET — download attendee CSV
│       ├── notifications/        # GET/POST — user notifications
│       ├── pay-deposit/          # GET — redirect to Stripe deposit payment
│       ├── salon-photos/         # POST/DELETE — manage salon images
│       ├── save-product/         # POST — toggle saved product
│       ├── save-salon/           # POST — toggle saved salon
│       ├── search/               # GET — cross-entity search
│       ├── stripe-webhook/       # POST — handle Stripe events
│       ├── upload-image/         # POST — upload to Supabase Storage
│       └── cron/reminders/       # GET — daily reminders + no-show marking
│
├── components/
│   ├── ui/                       # Button, Input, Modal, Toast, Badge
│   ├── salon/                    # SalonCard, ServiceRow, StarRating, ReviewCard
│   ├── shop/                     # ProductCard, AddToCartButton, WishlistButton,
│   │                             #   CartItem, CartSidebar
│   ├── booking/                  # SlotPicker, BookingCard
│   ├── dashboard/                # StatsCard, PhotoUpload
│   ├── layout/                   # Header, Footer, Breadcrumb, Tabs, PageHero
│   └── admin/                    # SalonRow, UserRow, AuditRow
│
├── hooks/
│   ├── useSupabase.ts            # Memoised Supabase browser client
│   ├── useUser.ts                # Auth user + profile state
│   ├── useCart.ts                # localStorage cart (add/remove/qty/clear)
│   └── useNotifications.ts      # Unread notification count + mark read
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client (Client Components)
│   │   ├── server.ts             # Server client + admin client
│   │   └── middleware.ts         # Session refresh on every request
│   ├── actions/
│   │   ├── auth.ts               # signUp, signIn, signOut, resetPassword
│   │   ├── salons.ts             # createSalon, saveSalon, submitReview, submitEnquiry
│   │   ├── bookings.ts           # createBooking, cancelBooking, updateBookingStatus
│   │   ├── dashboard.ts          # updateProfile, addService, updateHours, updateEnquiryStatus
│   │   ├── admin.ts              # updateSalonStatus, toggleFeatured, updateUserStatus
│   │   ├── shop.ts               # addToWishlist
│   │   ├── products.ts           # saveProduct, toggleProductActive, deleteProduct, updateStock
│   │   ├── events.ts             # createEvent, registerForEvent, cancelEventRegistration
│   │   └── account.ts            # updateProfile (customer)
│   ├── email.ts                  # 14 branded email functions (Resend)
│   └── utils.ts                  # fmtPrice, slugify, generateRef, generateSlots, validators
│
├── types/
│   └── database.ts               # TypeScript types for all 23 DB tables
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Complete PostgreSQL schema (521 lines)
│
├── public/
│   ├── favicon.svg
│   ├── manifest.json             # PWA manifest
│   ├── robots.txt
│   └── assets/
│       ├── images/og-default.svg
│       └── icons/icon-192.svg, icon-512.svg
│
├── middleware.ts                 # Route protection (redirect unauthenticated users)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── vercel.json                   # Cron: daily at 9am UTC
├── .env.local.example
└── package.json
```

---

## Database — 23 Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extends auth.users — name, hair type, account type, is_admin |
| `salons` | Salon listings — all details, plan, status, rating, images |
| `services` | Services per salon — price, duration, category |
| `salon_opening_hours` | Per-day hours with closed flag |
| `bookings` | Appointments — date, slot, status, deposit, reference |
| `products` | Shop products — price, stock, images, ingredients |
| `orders` | Shop orders — delivery address, Stripe session |
| `order_items` | Line items per order — price at purchase |
| `reviews` | Salon reviews — rating, text, verified flag |
| `events` | Community events — date, venue, capacity, RSVP count |
| `event_registrations` | Event sign-ups — name, email, ticket count |
| `saved_salons` | User's bookmarked salons |
| `saved_products` | User's wishlist products |
| `enquiries` | Messages sent to salons |
| `notifications` | In-app notifications per user |
| `coupons` | Discount codes — percent or fixed, usage limits |
| `coupon_uses` | Tracks which user used which coupon |
| `audit_logs` | Admin action log |
| `login_history` | Sign-in log per user |
| `review_reports` | Flagged reviews |
| `business_applications` | Salon registration history |
| `event_alerts` | Email alert subscriptions by city |
| `waitlist` | Pre-launch waitlist |

**RLS on all 23 tables. 4 triggers. decrement_stock() function.**

---

## Emails — 14 Branded Emails (Resend)

1. Welcome (customer + owner variants)
2. Salon Live confirmation
3. Booking Confirmation → customer
4. New Booking Alert → salon owner
5. Booking Reminder 24h before → customer (cron)
6. No-Show Notification → customer (cron)
7. Deposit Paid Confirmation → customer
8. Booking Status Change → customer
9. Enquiry Notification → salon owner
10. Order Confirmation → customer
11. Event Registration Confirmation → attendee
12. New RSVP Alert → organiser
13. Event Reminder day-before → attendees (cron)
14. Event Created Alert → admins

All emails are silent no-ops if `RESEND_API_KEY` is not set.  
Password reset is handled natively by Supabase Auth.

---

© 2026 Nexova Technologies Ltd
