# Car Company Website — Full Build Prompt & Specification (v2)

> A complete reference document for building a professional, full-stack car dealership website.
> Use this as your master guide throughout development.
> Updated to use a fully free stack for testing before any paid commitment.

---

## Project Overview

Build a full-stack car dealership website for a single car-selling company. The goal is to act as a
digital showroom that converts visitors into buyers and retains them as long-term customers and
referrers. This is NOT a marketplace — it showcases and sells only this company's inventory.

**Primary goals:**
- Let visitors browse and inquire about cars easily
- Capture every lead's contact information
- Give staff a powerful admin dashboard to manage everything
- Build a customer retention and referral system
- Work beautifully on mobile (most Nigerian users are on phones)

---

## Tech Stack (Fully Free for Testing)

| Layer | Technology | Free Tier Details |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Deployed on Vercel — free forever |
| Styling | Tailwind CSS | Free, open source |
| Backend | Node.js + Express | Deployed on Render — free web service |
| ORM | Prisma | Free, open source |
| Database | PostgreSQL via Supabase | Free — 500MB storage, visual table editor |
| Auth | JWT + bcryptjs | Free, open source |
| File Storage | Cloudinary | Free — 25GB storage, 25GB bandwidth |
| Email | Brevo | Free — 300 emails/day |
| SMS | Termii | Free trial credits |
| WhatsApp | wa.me links + WhatsApp Business App | Free manual approach during testing |
| Deployment | Vercel (frontend) + Render (backend) | Both free tiers available |

### Important note on Render free tier
Render's free backend service spins down after 15 minutes of inactivity. The first request
after idle takes 30–50 seconds to wake up. This is acceptable during testing but not for
production. When ready to go live, upgrade Render to a paid plan ($7/month) or migrate
to Railway which has better always-on performance.

### WhatsApp during testing
Skip the WhatsApp Business API during development — it requires Meta business verification
and approval. Use direct wa.me links on the frontend instead. When a customer clicks the
WhatsApp button, it opens a pre-filled message to your business number. Wire up the full
API when going to production.

### When you are ready to go to production, upgrade to:
- Render paid plan ($7/month) or Railway ($5/month) for always-on backend
- WhatsApp Business API (via Meta) for automated messaging
- Termii paid plan for bulk SMS

---

## Database Schema (Prisma + Supabase PostgreSQL)

### Setting up Supabase
1. Create a free account at supabase.com
2. Create a new project
3. Go to Settings → Database → Connection String → URI
4. Copy the connection string into your .env as DATABASE_URL
5. Supabase gives you a visual table editor to inspect your data while testing —
   similar to MongoDB Atlas

### Tables to build:

**Car** — stores every vehicle listing
- id, make, model, year, price, mileage, condition, fuelType, transmission
- color, description, status (available/sold/reserved), photos (array of Cloudinary URLs)
- featured (boolean for homepage spotlight), createdAt, updatedAt
- Relations: has many Leads

**Customer** — everyone who has ever bought or inquired
- id, name, email, phone, address
- referralCode (unique code given to each customer for sharing)
- referredBy (code of whoever referred this customer)
- createdAt
- Relations: has many Leads, has many Purchases

**Lead** — every inquiry/contact captured
- id, name, phone, email, message
- source (website / whatsapp / referral / walk-in)
- status (new / contacted / test_drive / negotiating / closed / lost)
- notes (sales rep notes), followUpAt (scheduled follow-up date)
- Relations: belongs to Car, belongs to Customer (optional), assigned to Staff

**Purchase** — completed sales record
- id, salePrice, purchasedAt
- Relations: belongs to Customer, belongs to Car

**Staff** — admin dashboard users
- id, name, email, password (hashed with bcrypt), role (admin / sales_rep / manager)
- Relations: has many Leads (assigned)

**Referral** — tracks referral activity
- id, code, referrerId, referredId, converted (boolean), rewardPaid (boolean), createdAt

### Full Prisma schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Car {
  id           String   @id @default(uuid())
  make         String
  model        String
  year         Int
  price        Float
  mileage      Int
  condition    String
  fuelType     String
  transmission String
  color        String
  description  String?
  status       String   @default("available")
  photos       String[]
  featured     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  leads        Lead[]
}

model Customer {
  id           String     @id @default(uuid())
  name         String
  email        String?    @unique
  phone        String     @unique
  address      String?
  referralCode String?    @unique @default(uuid())
  referredBy   String?
  createdAt    DateTime   @default(now())
  leads        Lead[]
  purchases    Purchase[]
}

model Lead {
  id         String    @id @default(uuid())
  name       String
  phone      String
  email      String?
  message    String?
  source     String    @default("website")
  status     String    @default("new")
  notes      String?
  followUpAt DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  car        Car       @relation(fields: [carId], references: [id])
  carId      String
  customer   Customer? @relation(fields: [customerId], references: [id])
  customerId String?
  assignedTo Staff?    @relation(fields: [staffId], references: [id])
  staffId    String?
}

model Purchase {
  id          String   @id @default(uuid())
  salePrice   Float
  purchasedAt DateTime @default(now())
  customer    Customer @relation(fields: [customerId], references: [id])
  customerId  String
}

model Staff {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      String   @default("sales_rep")
  createdAt DateTime @default(now())
  leads     Lead[]
}

model Referral {
  id         String   @id @default(uuid())
  code       String   @unique
  referrerId String
  referredId String?
  converted  Boolean  @default(false)
  rewardPaid Boolean  @default(false)
  createdAt  DateTime @default(now())
}
```

---

## Backend — API Routes to Build

### Auth routes (/api/auth)
- POST /login — staff login, validates email + password, returns JWT
- POST /logout — clears session
- GET /me — returns current logged-in staff profile (requires valid JWT)

### Cars routes (/api/cars)
- GET / — get all cars with optional query filters:
  status, condition, make, minPrice, maxPrice, fuelType, transmission, featured
- GET /:id — get single car with full details
- POST / — create new car listing [admin only]
- PATCH /:id — update any car field or status [admin only]
- DELETE /:id — delete a listing [admin only]
- POST /:id/photos — upload photos to Cloudinary, save URLs to car record [admin only]

### Leads routes (/api/leads)
- GET / — get all leads with filters: status, carId, staffId, dateRange [admin only]
- GET /:id — get single lead with full details [admin only]
- POST / — create new lead — PUBLIC endpoint, called when inquiry form is submitted.
  Must: save lead to DB, notify staff via SMS, send acknowledgement SMS to customer
- PATCH /:id — update lead status, notes, followUpAt [admin only]
- POST /:id/assign — assign lead to a staff member [admin only]

### Customers routes (/api/customers)
- GET / — all customers with search [admin only]
- GET /:id — customer profile with full history [admin only]
- POST / — create customer (also triggered internally when a lead is created)
- PATCH /:id — update customer details [admin only]
- GET /:id/leads — all inquiries this customer made [admin only]
- GET /:id/purchases — all purchases this customer made [admin only]

### Referrals routes (/api/referrals)
- GET / — all referrals with status [admin only]
- GET /track/:code — called when someone visits site via referral link,
  stores the code in a cookie for attribution
- POST /convert — mark a referral as converted after a purchase [admin only]
- PATCH /:id/reward — mark a referral reward as paid [admin only]

### Notifications routes (/api/notifications)
- POST /email/broadcast — send bulk email to selected customers via Brevo [admin only]
- POST /sms — send SMS to a single customer via Termii [admin only]
- POST /whatsapp — generate pre-filled WhatsApp link or send via API [admin only]

### Analytics routes (/api/analytics)
- GET /overview — totals: cars in stock, leads today, customers total, conversion rate
- GET /cars/top — most viewed and most inquired car listings
- GET /leads/pipeline — lead count grouped by status
- GET /staff/performance — leads assigned and closed per staff member
- GET /revenue — total sales value grouped by month

---

## Frontend — Pages to Build

### Public pages (visible to everyone)

**Homepage (/)**
- Hero section: large banner with company name, tagline, and a prominent
  search/filter bar (make, condition, price range)
- Featured cars section: 3–6 cars marked as featured in the database
- Why choose us: 3–4 trust indicators (years in business, cars sold, warranty, etc.)
- Customer testimonials: carousel or grid of reviews
- Call to action banner: "Looking for a specific car? Tell us and we'll find it."
  with a WhatsApp link
- Footer: address, phone number, email, social links, Google Maps embed
- WhatsApp floating button: fixed bottom-right corner on ALL pages,
  links to wa.me/[BUSINESS_NUMBER]

**Inventory page (/cars)**
- Filter bar: price range slider, make dropdown, condition, fuel type, transmission, year range
- Car grid: responsive — 3 columns desktop, 2 tablet, 1 mobile
- Each car card shows: main photo, make + model + year, price (formatted in Naira),
  condition badge, mileage, "View Details" button
- Status badge: Available (green) / Sold (red) / Reserved (amber)
- Sort options: newest first, price low-high, price high-low
- Empty state: friendly message if no cars match filters
- Pagination: 12 cars per page

**Car detail page (/cars/[id])**
- Photo gallery: large main photo with thumbnail strip below, click to enlarge,
  swipeable on mobile
- Car title: Year Make Model displayed prominently
- Price: large, formatted (e.g. ₦4,500,000)
- Specs table: condition, mileage, fuel type, transmission, color, year
- Description: full text from listing
- Inquiry form: name, phone number, email (optional), message (pre-filled with
  car name), submit button. On submit, creates a Lead via POST /api/leads
- WhatsApp button: links to wa.me with pre-filled message:
  "Hi, I'm interested in the [Year Make Model] listed for [Price]. Is it still available?"
- Book a Test Drive button: opens a modal with name, phone, preferred date
- Loan calculator: input deposit amount, loan tenure in months, interest rate —
  calculates and displays estimated monthly payment
- Related cars: 3–4 similar cars by make or price range at page bottom
- Dynamic meta tags for SEO: title and description generated from car data

**About page (/about)**
- Company story and mission statement
- Team section: photo, name, and role for each team member
- Showroom photo gallery
- Key stats: years in business, cars sold, happy customers
- Google Maps embed showing physical showroom location

**Blog page (/blog) — optional but good for SEO**
- Grid of articles: buying guides, car tips, market news, maintenance advice
- Each article at /blog/[slug] with full content
- Managed from admin dashboard

**Contact page (/contact)**
- Contact form: name, phone, email, subject, message
- Company details: phone, email, address, working hours
- WhatsApp link button
- Google Maps embed

### Admin dashboard pages (protected by JWT — staff only)

**Login page (/admin/login)**
- Email and password fields
- JWT stored in localStorage or httpOnly cookie
- Redirect to /admin on success

**Dashboard overview (/admin)**
- Metric cards: total cars in stock, new leads today, total customers, conversion rate
- Recent leads table: last 10 leads with name, car, status, time
- Quick action buttons: Add New Car, View All Leads, Send Broadcast

**Inventory management (/admin/cars)**
- Searchable, sortable table of all cars
- Columns: photo thumbnail, make + model, year, price, condition, status, date added, actions
- Actions per row: Edit, Delete, Mark as Sold
- Add New Car button navigates to /admin/cars/new
- Bulk actions: select multiple, mark as sold or delete

**Add/Edit car form (/admin/cars/new and /admin/cars/[id]/edit)**
- All car fields: make, model, year, price, mileage, condition, fuel type,
  transmission, color, description
- Photo uploader: drag and drop multiple photos, upload to Cloudinary,
  drag to reorder, first photo becomes main listing photo
- Featured toggle: checkbox to show this car on the homepage
- Status selector: available / sold / reserved
- Save button creates or updates car via API

**Leads & CRM (/admin/leads)**
- Kanban board with columns: New, Contacted, Test Drive, Negotiating, Closed, Lost
- Each lead card shows: customer name, car name, phone number, time since inquiry
- Click a lead card to open a side drawer with:
  - Customer name, phone, email
  - Which car they inquired about with link to listing
  - Inquiry message and status dropdown
  - Assign to staff dropdown
  - Schedule follow-up date and time
  - Notes area for staff to log conversations
  - WhatsApp link to open direct chat with customer
- Filter leads by status, assigned staff, date range
- Table view toggle for users who prefer a list

**Customers (/admin/customers)**
- Searchable table of all customers
- Click a customer to see full profile:
  - Contact details
  - Their unique referral link to share
  - Referral history: who they referred, status, reward paid
  - All inquiries and purchases
  - Full interaction timeline
- Add customer manually (for walk-ins)
- Export customers to CSV

**Marketing (/admin/marketing)**
- WhatsApp section: compose a message, select customer segment, send
  (during testing generates wa.me links for manual sending)
- Email broadcast: subject, rich text body, select recipients, send via Brevo
- SMS blast: short message, select recipients, send via Termii
- Referral manager: all codes, conversions, mark reward as paid
- Promo banner: set active promotional text shown on homepage

**Analytics (/admin/analytics)**
- Line chart: leads per week over last 3 months
- Funnel chart: lead pipeline from New to Closed
- Bar chart: revenue by month
- Top listings table: cars ranked by inquiry count
- Staff leaderboard: leads handled, closed, conversion rate
- Referral performance stats

**Staff management (/admin/staff)**
- Table of all staff accounts
- Add staff: name, email, password, role
- Edit role per staff member
- Deactivate account (disables login without deleting records)

---

## Key Features — Detailed Implementation Notes

### Lead capture (most critical feature)
Every inquiry form submission must:
1. Validate required fields — name and phone are the minimum
2. POST to /api/leads and save to the database immediately
3. Check if a Customer exists for this phone number —
   link to existing customer or create a new one
4. Check for a referral cookie and link to the referral code if found
5. Return a success response to the frontend immediately
6. In the background (async): notify staff via SMS and send
   an acknowledgement SMS to the customer

### WhatsApp integration (testing approach)
All WhatsApp functionality uses wa.me links during testing:
- Floating button on all pages opens: wa.me/[NUMBER] with a generic greeting
- Per-car button on detail page pre-fills: "Hi, I'm interested in the [YEAR]
  [MAKE] [MODEL] listed for [PRICE]. Is it still available?"
- Admin CRM gives each lead a WhatsApp link to open chat directly
Replace wa.me links with WhatsApp Business API calls when going to production.

### Customer retention — automated follow-up scheduler
A cron job running daily (node-cron) checks the database and triggers:
- 3 days after a lead with no status change: flag in CRM, notify assigned staff
- 3 months after purchase: "hope you're enjoying the car, we have new arrivals"
- 6 months after purchase: "thinking of upgrading? Returning customer discount"
- 12 months after purchase: "it's been a year! Trade-in offer available"
All sent messages are logged in the database.

### Referral system
1. Every Customer record gets a unique referralCode on creation
2. Share link: yourwebsite.com/cars?ref=THEIR_CODE
3. Visitor arrives with ?ref= in URL, code stored in a 30-day browser cookie
4. When that visitor submits an inquiry form, the cookie is read and the
   referral code is attached to the Lead record
5. When the lead converts to a purchase, POST /api/referrals/convert marks it
6. Admin sees all referrals in marketing dashboard and marks rewards as paid

### Photo management with Cloudinary
1. Staff uploads multiple photos in the admin car form
2. Frontend sends files to backend as multipart/form-data
3. Backend uses multer to receive files, uploads each to Cloudinary
4. Cloudinary returns a secure_url for each photo
5. URLs saved as an array in Car.photos in PostgreSQL
6. Frontend uses Next.js Image component with Cloudinary URLs
7. Apply Cloudinary transformations: auto format, auto quality, max width 1200px

### Authentication and role-based access
- Staff logs in with email and password, receives a signed JWT
- JWT payload contains staffId, email, and role
- All admin API routes verify the JWT via middleware
- Role access: admin = everything; manager = analytics and marketing;
  sales_rep = leads and view-only inventory
- Passwords hashed with bcrypt at saltRounds 12 before storing

### SEO
- Dynamic meta tags on every car page using Next.js metadata API
- Open Graph tags so car links shared on WhatsApp show a photo preview
- JSON-LD Vehicle structured data on car detail pages for Google rich results
- Auto-generated sitemap.xml with next-sitemap package
- Descriptive alt text on all car photos

---

## Project Folder Structure

```
car-company/
│
├── frontend/                          (Next.js 14)
│   ├── app/
│   │   ├── page.jsx                   homepage
│   │   ├── cars/
│   │   │   ├── page.jsx               inventory listing
│   │   │   └── [id]/page.jsx          car detail
│   │   ├── about/page.jsx
│   │   ├── contact/page.jsx
│   │   ├── blog/
│   │   │   ├── page.jsx
│   │   │   └── [slug]/page.jsx
│   │   └── admin/
│   │       ├── login/page.jsx
│   │       ├── page.jsx               dashboard overview
│   │       ├── cars/
│   │       │   ├── page.jsx
│   │       │   ├── new/page.jsx
│   │       │   └── [id]/edit/page.jsx
│   │       ├── leads/page.jsx
│   │       ├── customers/page.jsx
│   │       ├── marketing/page.jsx
│   │       ├── analytics/page.jsx
│   │       └── staff/page.jsx
│   ├── components/
│   │   ├── ui/                        buttons, inputs, modals, badges
│   │   ├── cars/                      CarCard, CarGrid, CarFilter, PhotoGallery
│   │   ├── forms/                     InquiryForm, TestDriveForm, LoanCalculator
│   │   ├── admin/                     Sidebar, DataTable, KanbanBoard, LeadDrawer
│   │   └── layout/                    Navbar, Footer, WhatsAppButton
│   └── lib/
│       ├── api.js                     axios instance pointing to backend URL
│       └── utils.js                   formatPrice, formatDate helpers
│
└── backend/                           (Node.js + Express)
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    ├── routes/
    │   ├── auth.js
    │   ├── cars.js
    │   ├── leads.js
    │   ├── customers.js
    │   ├── referrals.js
    │   ├── notifications.js
    │   └── analytics.js
    ├── controllers/
    ├── middleware/
    │   ├── auth.js                    JWT verification middleware
    │   └── roleCheck.js               role-based access control
    ├── services/
    │   ├── cloudinary.js              photo upload helper
    │   ├── brevo.js                   email sending helper
    │   ├── termii.js                  SMS sending helper
    │   └── scheduler.js              node-cron follow-up jobs
    └── index.js                       Express server entry point
```

---

## Environment Variables

```env
# Database (from Supabase: Settings → Database → Connection String → URI)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Auth
JWT_SECRET="your-long-random-secret-key"

# Cloudinary (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"

# Email — Brevo (brevo.com → SMTP & API → API Keys)
BREVO_API_KEY="xxx"
FROM_EMAIL="info@yourcompany.com"
FROM_NAME="Your Company Name"

# SMS — Termii (termii.com dashboard)
TERMII_API_KEY="xxx"
TERMII_SENDER_ID="YourCompany"

# WhatsApp (wa.me approach during testing)
NEXT_PUBLIC_WHATSAPP_NUMBER="2348012345678"

# App URLs
NEXT_PUBLIC_API_URL="https://your-backend.onrender.com"
NEXT_PUBLIC_SITE_URL="https://your-frontend.vercel.app"
PORT=5000
```

---

## Build Order (Recommended)

Follow this sequence — each step produces something working and testable:

1. Backend setup — Express server, Prisma schema, Supabase connection, run migration,
   confirm all tables appear in the Supabase visual table editor
2. Cars API — full CRUD, test every endpoint with Postman or Thunder Client
3. Leads API — inquiry capture, customer auto-creation, SMS notification
4. Auth API — staff login with JWT, protect all admin routes
5. Customers and Referrals API — customer profiles and referral tracking
6. Analytics API — aggregation queries for dashboard
7. Frontend public pages — homepage, inventory, car detail, about, contact
8. Frontend admin dashboard — login, inventory, CRM, marketing, analytics
9. Cloudinary integration — photo upload in admin car form
10. Email integration — Brevo broadcast from marketing dashboard
11. Follow-up scheduler — node-cron daily jobs for customer retention
12. SEO — meta tags, Open Graph, JSON-LD, sitemap
13. Polish — loading states, error states, empty states, mobile QA
14. Deploy — backend to Render, frontend to Vercel, DB already on Supabase

---

## Going to Production Checklist

When ready to launch and take real customers:

- [ ] Upgrade Render to paid plan ($7/month) to remove cold start delay
- [ ] Set up WhatsApp Business API via Meta for automated messaging
- [ ] Replace all wa.me links with WhatsApp API calls in notification service
- [ ] Add reCAPTCHA to public inquiry forms to prevent spam
- [ ] Point a custom domain to Vercel and Render
- [ ] Enable Supabase automatic daily backups
- [ ] Add error monitoring (Sentry free tier)
- [ ] Add uptime monitoring (Better Uptime free tier)
- [ ] Tighten CORS to only allow your frontend domain
- [ ] Test all forms and flows on real Android and iOS devices

---

*Document version 2 — fully free testing stack.*
*Upgrade path: Supabase stays, Render → Railway or paid Render when scaling.*
