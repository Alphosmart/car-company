# Navbar Mega Menu Implementation Plan

## Goal
Implement a premium mega-menu navbar (as in the reference) and make every menu item functional with real pages, filters, forms, and backend APIs.

## Current State Summary
- Existing public nav: Home, Inventory, Blog, About, Contact.
- Existing frontend pages: /, /cars, /blog, /about, /contact, /login.
- Existing backend supports cars, blog, leads, test drives, company profile, analytics.
- Missing: mega-menu structure, category-based inventory routes, ownership tools pages, network pages, sell/swap workflow pages.

## Full Navigation Menu Inventory (Target)

### 1) Vehicles
- Browse All Vehicles
- Executive Class Cars
- Sport and Performance
- Luxury SUVs
- Electric Vehicles
- Daily Luxury
- Power Bikes
- Vans and Buses

### 2) Ownership Tools
- AI Car Match
- Loan Calculator
- Compare Vehicles
- Value Estimator
- Car History Check

### 3) Sarkin Mota Network
- Car Concierge
- Auto Experts
- Car Clubs
- Verified Customs
- Verified Technicians
- Partner with Us

### 4) Sell or Swap
- Sell Your Vehicle
- Trade-In / Swap
- Instant Valuation
- Seller Dashboard

### 5) News and Events
- News
- Events

### 6) About

### 7) Contact Us

## Route and Feature Mapping

| Menu Item | Frontend Route | Status | Functional Requirement |
|---|---|---|---|
| Browse All Vehicles | /cars | Exists | Keep as inventory landing page |
| Executive Class Cars | /cars?segment=executive | Missing filter support | Add segment filtering in frontend + backend |
| Sport and Performance | /cars?segment=sport-performance | Missing filter support | Add segment filtering in frontend + backend |
| Luxury SUVs | /cars?segment=luxury-suv | Missing filter support | Add segment filtering in frontend + backend |
| Electric Vehicles | /cars?fuelType=electric | Partly supported | Add dedicated menu link |
| Daily Luxury | /cars?segment=daily-luxury | Missing filter support | Add segment filtering in frontend + backend |
| Power Bikes | /cars?type=bike | Missing data model | Add vehicleType field and filter |
| Vans and Buses | /cars?type=van-bus | Missing data model | Add vehicleType field and filter |
| AI Car Match | /tools/ai-car-match | Missing | Build form + recommendation endpoint |
| Loan Calculator | /tools/loan-calculator | Missing | Build calculator UI (client side first) |
| Compare Vehicles | /tools/compare | Missing | Select up to 3 cars and compare specs |
| Value Estimator | /tools/value-estimator | Missing | Build estimate form + pricing logic endpoint |
| Car History Check | /tools/history-check | Missing | Build VIN/chassis form + provider integration placeholder |
| Car Concierge | /network/concierge | Missing | Service info + lead capture |
| Auto Experts | /network/experts | Missing | Directory/listing + inquiry action |
| Car Clubs | /network/clubs | Missing | Community listing + join form |
| Verified Customs | /network/customs | Missing | Partner listing + quote request |
| Verified Technicians | /network/technicians | Missing | Technician listing + booking request |
| Partner with Us | /network/partner-with-us | Missing | Partnership application form |
| Sell Your Vehicle | /sell/sell-your-vehicle | Missing | Submission form + media upload |
| Trade-In / Swap | /sell/trade-in-swap | Missing | Trade-in form + desired vehicle selection |
| Instant Valuation | /sell/instant-valuation | Missing | Simple instant estimate calculator |
| Seller Dashboard | /sell/dashboard | Missing | Authenticated seller submissions and status |
| News and Events | /news-events | Missing | Dynamic list page with categories |
| About | /about | Exists | Keep and link from navbar |
| Contact Us | /contact | Exists | Keep and link from navbar |

## Navbar Implementation Tasks

### A. Component Architecture
- Replace simple link list in Navbar with menu config object.
- Add mega-menu desktop behavior:
  - Hover and focus to open.
  - Delay close for cursor movement stability.
  - Keyboard navigation (Tab, Escape, Arrow keys minimal support).
- Add mobile behavior:
  - Hamburger drawer.
  - Accordion sections for Vehicles, Ownership Tools, Network, Sell or Swap.
- Keep Login/Admin actions on the right side.

### B. UI and Interaction
- Dark translucent dropdown panels with blur.
- Gold accent title and section divider.
- Two-column or three-column menu grid.
- Smooth reveal animations (opacity + translateY).
- Active menu item highlight based on current route.

### C. Data-Driven Menu
- Create a central menu config in frontend/lib/navigation.ts:
  - Top-level label
  - Optional submenu sections
  - Item title, description, href
- Use same config for desktop and mobile to avoid drift.

## Additions Required in Frontend App

### New Pages to Create
- /tools/ai-car-match
- /tools/loan-calculator
- /tools/compare
- /tools/value-estimator
- /tools/history-check
- /network/concierge
- /network/experts
- /network/clubs
- /network/customs
- /network/technicians
- /network/partner-with-us
- /sell/sell-your-vehicle
- /sell/trade-in-swap
- /sell/instant-valuation
- /sell/dashboard
- /news-events

### Shared Components to Add
- MegaMenu.tsx
- MobileNavDrawer.tsx
- MenuSectionGrid.tsx
- ComparisonTable.tsx
- ValuationForm.tsx
- PartnershipForm.tsx

### Frontend API Utilities to Add
- getCarRecommendations()
- compareCarsByIds()
- getValuationEstimate()
- submitSellerLead()
- getNetworkPartners()

## Additions Required in Backend App

### New API Routes
- GET /api/cars/compare?ids=a,b,c
- POST /api/tools/car-match
- POST /api/tools/value-estimator
- POST /api/tools/history-check
- GET /api/network/partners?type=customs|technician|expert
- POST /api/sell/vehicle
- POST /api/sell/trade-in
- GET /api/sell/dashboard

### Existing Route Updates
- Extend GET /api/cars filters with:
  - segment (executive, sport-performance, luxury-suv, daily-luxury)
  - type (car, bike, van-bus)

### Prisma Schema Additions
- Car model:
  - vehicleType String @default("car")
  - segment String?
- Add SellerSubmission model for sell/swap flow.
- Add NetworkPartner model for experts/customs/technicians directories.
- Optional: Add CarValuationLog model for estimator tracking.

## Implementation Phases

### Phase 1 (Fast MVP)
- Build mega-menu UI in navbar.
- Wire links to existing pages and placeholder pages.
- Implement Vehicles links that already work via current filters.

### Phase 2 (Functional Tools)
- Add tools pages and basic calculators.
- Add compare and valuation API endpoints.
- Add sell/swap form submission flow.

### Phase 3 (Network and Seller Features)
- Add network directory data + forms.
- Add seller dashboard with authentication and status tracking.
- Add news and events dynamic page.

## Acceptance Criteria
- Every visible navbar menu item has a valid route.
- No dead links in desktop or mobile navigation.
- Vehicles submenu links return filtered inventory results.
- Ownership tools, network pages, and sell pages are available and load.
- Navbar works with mouse, keyboard, and mobile touch.
- Admin/login controls remain accessible and unchanged in behavior.
