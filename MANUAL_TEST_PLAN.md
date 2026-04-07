# Phase — Manual Test Plan

**URL:** http://localhost:3002
**Date:** April 2026
**Tester:** _______________

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Superadmin | admin@phase.com | AdminPass2026 |
| Owner (verified, Professional plan) | elena@phase.com | ElenaPass2026 |
| Owner (verified, Starter plan) | roberto@phase.com | RobertoPass2026 |
| Owner (pending verification, no plan) | sofia@phase.com | SofiaPass2026 |

---

## SECTION 1: Public Pages (No Login Required)

### 1.1 Landing Page
- [ ] Open http://localhost:3002
- [ ] Verify hero text: "Find Your Perfect Boarding House in Mati City"
- [ ] Verify search bar with dropdowns (Barangays, Types, Price)
- [ ] Verify stat cards: "500+ Rooms", "40+ Boarding Houses", "98% Satisfaction"
- [ ] Scroll down — verify "Featured Boarding Houses" shows Casa Marina from DB
- [ ] Verify "How It Works" section (3 steps)
- [ ] Verify "Pricing" section (3 tiers: Free, ₱999, ₱2,499)
- [ ] Verify footer with Phase branding
- [ ] Click "Find a Room" in navbar → should go to /find
- [ ] Click "Register" button → should go to /register

### 1.2 Boarding House Finder
- [ ] Open http://localhost:3002/find
- [ ] Verify "Find Boarding Houses in Mati City" heading
- [ ] Verify Casa Marina Residences and Sunrise Student Hub are shown (2 published houses)
- [ ] Verify Green Meadow is NOT shown (unpublished)
- [ ] Click "Filters" → expand filter panel
- [ ] Filter by "Female" type → only Casa Marina should show
- [ ] Filter by "Male" type → only Sunrise Student Hub should show (if published as MIXED, both may show)
- [ ] Adjust max price slider to ₱2,500 → verify filtering works
- [ ] Search "Sainz" → should show Casa Marina only
- [ ] Clear all filters → both houses return

---

## SECTION 2: Authentication

### 2.1 Registration (New Owner)
- [ ] Open http://localhost:3002/register
- [ ] Try submitting with weak password "short" → should show "Minimum 8 characters"
- [ ] Try password "alllowercase1" → should show "must contain uppercase"
- [ ] Try password "NoNumbersHere" → should show "must contain number"
- [ ] Try mismatched passwords → should show "do not match"
- [ ] Fill valid form: Name="Test Owner", Email="test@test.com", Phone="0920-000-1111", Password="Test1234", Confirm="Test1234"
- [ ] Check terms checkbox
- [ ] Click "Create account" → should redirect to /dashboard
- [ ] Verify dashboard loads (empty — no properties yet)

### 2.2 Logout
- [ ] Click user profile at bottom of sidebar → expand dropdown
- [ ] Click "Sign Out" → should redirect to /login

### 2.3 Login
- [ ] Open http://localhost:3002/login
- [ ] Try wrong password → should show "Invalid email or password"
- [ ] Try 6 rapid wrong logins → 6th should show "Too many login attempts. Try again in 15 minutes."
- [ ] Wait or clear cookies, then login as elena@phase.com / ElenaPass2026
- [ ] Verify redirect to /dashboard
- [ ] Verify greeting "Good morning/afternoon/evening, Elena"

### 2.4 Route Protection
- [ ] While logged in as Elena, try visiting http://localhost:3002/admin → should redirect to /dashboard
- [ ] While logged in as Elena, try visiting http://localhost:3002/login → should redirect to /dashboard
- [ ] Log out, then try visiting http://localhost:3002/dashboard → should redirect to /login
- [ ] Log out, then try visiting http://localhost:3002/admin → should redirect to /login

---

## SECTION 3: Owner Dashboard (Login as elena@phase.com)

### 3.1 Dashboard Home
- [ ] Verify stat cards show:
  - Total Tenants: **8**
  - Occupancy Rate: **67%**
  - Pending Invoices: count shown
  - Monthly Revenue: amount shown
- [ ] Verify Revenue Overview chart shows bars for Jan-Apr
  - Jan: ~₱17k, Feb: ~₱17k, Mar: ~₱21k, Apr: ~₱14k
- [ ] Verify Quick Actions: "Add New Tenant", "Generate Invoice", "Send Reminders", "View Reports"
- [ ] Click each Quick Action → verify navigation
- [ ] Verify Recent Invoices list shows recent billing activity with status badges (PAID/PENDING/OVERDUE)
- [ ] Verify notification bell shows **2** (unread count badge)
- [ ] Click bell → verify dropdown with 5 notifications (2 unread with blue dots)
- [ ] Click "Mark all read" → unread count should become 0

### 3.2 Properties
- [ ] Navigate to /dashboard/properties
- [ ] Verify header stats: **12 Total Rooms, 8 Occupied, 3 Available, 1 Maintenance**
- [ ] Verify Casa Marina Residences card with:
  - Type badge: "All Female"
  - Verified badge
  - Amenities: WiFi, CCTV, Kitchen, Laundry, Study Area
  - House Rules: Curfew 22:00, No Pets, No Visitors After 9PM, Quiet Hours
  - Contact: 0917-111-2222, elena@phase.com
- [ ] Scroll to Room Management grid
- [ ] Verify room cards show:
  - Occupied rooms (e.g., 101): blue badge, tenant name, rate
  - Available rooms (e.g., 103): dashed border, "Assign Tenant" button
  - Maintenance room (202): red badge
- [ ] Verify each room shows correct amenity icons (AC, WiFi, Bath, Elec)

### 3.3 Property Detail
- [ ] Click "View Details" on Casa Marina → navigate to /dashboard/properties/[id]
- [ ] Verify tabs: Overview, Rooms, Tenants, Settings
- [ ] **Overview tab**: Stats (Total Rooms, Occupied, Vacancy Rate, Monthly Revenue), Description, Amenities, House Rules
- [ ] **Rooms tab**: Same room card grid as properties page
- [ ] **Tenants tab**: Table with Name, Room, Move-in Date, Status, Balance columns
  - Verify 8 tenants listed with correct room assignments
- [ ] **Settings tab**: Form with property name, address, type dropdown, curfew time, description
- [ ] Click "Back to Properties" → return to listing

### 3.4 Tenants
- [ ] Navigate to /dashboard/tenants
- [ ] Verify stats: **8 Total, 8 Active, 0 Pending, 0 Inactive**
- [ ] Verify tenant table shows all 8 tenants with:
  - Avatar initials (e.g., MS for Maria Santos)
  - Email and phone
  - Room number
  - Status badge (ACTIVE in green)
  - Move-in date
  - Monthly rent
- [ ] Type "Maria" in search → should filter to Maria Santos only
- [ ] Clear search, click "Active" filter chip → should show all 8
- [ ] Click "Pending" filter → should show 0 with empty state message

### 3.5 Invoices
- [ ] Navigate to /dashboard/invoices
- [ ] Verify filter tabs with counts: All, Pending, Paid, Overdue
- [ ] Verify invoice table columns: Invoice #, Tenant, Type, Amount, Due Date, Status, Sent Via, Actions
- [ ] Click "Pending" tab → only pending invoices shown
- [ ] Click "Overdue" tab → should show Lisa Mendoza's overdue invoice (₱3,500)
- [ ] Click "Paid" tab → paid invoices shown
- [ ] Verify "Sent Via" column shows EMAIL/SMS/BOTH icons where applicable
- [ ] **Create Invoice**: Click "+ Create Invoice" button
  - Select a tenant from dropdown
  - Choose type "Rent"
  - Enter amount: 3000
  - Set due date
  - Click "Create & Send" → toast: "Invoice created successfully"
  - Verify new invoice appears in table
- [ ] **Mark as Paid**: Click the eye icon on a PENDING invoice → toast: "Invoice marked as paid"
  - Verify status changes to PAID
- [ ] **Send Invoice**: Click send icon on an unsent invoice → toast shows send confirmation
- [ ] Verify summary cards at bottom: Total Invoiced, Total Paid, Total Pending, Total Overdue

### 3.6 Billing
- [ ] Navigate to /dashboard/billing
- [ ] Verify 3 metric cards:
  - Total Revenue This Month: **₱14,400**
  - Outstanding Balance: amount shown
  - Collection Rate: **~81%**
- [ ] Verify Monthly Revenue chart matches:
  - Jan: ₱17,400 | Feb: ₱17,400 | Mar: ₱21,150 | Apr: ₱14,400
  - Total label: **₱70,350**
- [ ] Verify Recent Payments table shows paid invoices with tenant name, room, amount, date

### 3.7 Room Transfers
- [ ] Navigate to /dashboard/transfers
- [ ] Verify Transfer History shows:
  - Ana Reyes: 201→305 (COMPLETED)
  - Grace Lim: 203→302 (PENDING)
- [ ] **Initiate Transfer**:
  - Select a tenant from dropdown (e.g., Mark Rivera)
  - "From Room" should auto-fill (Room 301)
  - Select destination room from available rooms
  - Enter reason: "Wants AC room"
  - Click "Submit Transfer" → verify it appears in history as PENDING

### 3.8 Settings
- [ ] Navigate to /dashboard/settings
- [ ] **Profile tab**: Verify shows "Elena Magsaysay", elena@phase.com, 0917-111-2222
- [ ] **Notifications tab**: Verify toggle switches for notification preferences
- [ ] **Subscription tab**: Verify shows "Professional" plan at ₱999/month with features
- [ ] **Security tab**: Verify change password form and 2FA section

### 3.9 Global Search
- [ ] Click the search bar in the top navbar
- [ ] Type "Maria" → should show Maria Santos as a tenant result
- [ ] Type "101" → should show Room 101 as a room result
- [ ] Type "PH-" → should show invoice results
- [ ] Click a result → should navigate to the relevant page

---

## SECTION 4: Superadmin Portal (Login as admin@phase.com)

### 4.1 Platform Overview
- [ ] Login as admin@phase.com / AdminPass2026 → should redirect to /admin
- [ ] Verify stat cards:
  - Total Owners: **3** (2 verified)
  - Boarding Houses: **3** (20 total rooms)
  - Total Tenants: **14** (active)
  - Platform Revenue: **₱89,350**
- [ ] Verify Pending Verifications section shows Sofia Ramos
- [ ] Verify Registered Owners table shows Elena (Professional), Roberto (Starter), Sofia (Pending)

### 4.2 Owner Verification
- [ ] Find Sofia Ramos in pending verifications
- [ ] Click "Approve" → toast: "Owner verified successfully"
- [ ] Verify Sofia moves from pending to verified in the table
- [ ] Verify pending count decreases

### 4.3 Owner Management
- [ ] Navigate to /admin/owners
- [ ] Verify owner list with: Name, Email, Properties count, Plan, Status
- [ ] Click an owner → verify detail panel shows on the right with full info
- [ ] Verify approve/reject buttons work for unverified owners

### 4.4 Analytics
- [ ] Navigate to /admin/analytics
- [ ] Verify KPIs:
  - Total Revenue: **₱89,350**
  - Avg Occupancy: **70%** (14/20 rooms)
  - Active Tenants: **14**
  - Boarding Houses: **3**
- [ ] Verify Revenue Trend chart (monthly bars)
  - Mar should show ~₱34k (Elena ₱21,150 + Roberto ₱13,000)
  - Apr should show ~₱20k (Elena ₱14,400 + Roberto ₱6,000)
- [ ] Verify Subscription Plans:
  - Starter: 1 owner (50%)
  - Professional: 1 owner (50%)
  - Enterprise: 0 owners (0%)
- [ ] Verify Platform Occupancy Overview: 20 rooms, 14 tenants, 70%, 3 houses

### 4.5 Admin Route Protection
- [ ] While logged as admin, verify /admin pages are accessible
- [ ] Log out, login as elena@phase.com, try /admin → should redirect to /dashboard

---

## SECTION 5: Cross-Owner Data Isolation

### 5.1 Elena Can't See Roberto's Data
- [ ] Login as elena@phase.com
- [ ] Go to /dashboard/tenants → should only see 8 tenants (NOT Diego, Carmen, Rafael, Isabella)
- [ ] Go to /dashboard/properties → should only see Casa Marina (NOT Sunrise Student Hub)
- [ ] Go to /dashboard/invoices → should only see Casa Marina invoices

### 5.2 Roberto Can't See Elena's Data
- [ ] Login as roberto@phase.com
- [ ] Go to /dashboard/tenants → should only see 4 tenants (Diego, Carmen, Rafael, Isabella)
- [ ] Go to /dashboard/properties → should only see Sunrise Student Hub
- [ ] Verify dashboard stats reflect Roberto's data only

---

## SECTION 6: Mobile Responsiveness

Test all pages at **375px width** (Chrome DevTools → Toggle Device Toolbar → iPhone SE):

- [ ] Landing page: Hamburger menu visible, stacked content, search bar fills width
- [ ] Login page: Form centered, no horizontal overflow
- [ ] Dashboard: Sidebar hidden, hamburger menu toggle works, stat cards stack vertically
- [ ] Tenants: Card layout instead of table rows on mobile
- [ ] Invoices: Card layout on mobile
- [ ] Finder: Single column cards, filters collapse
- [ ] Admin: Sidebar hidden with hamburger toggle

---

## SECTION 7: Error Handling

- [ ] Visit http://localhost:3002/nonexistent → verify 404 page with "Page not found" and "Go Home" button
- [ ] Visit http://localhost:3002/dashboard/properties/fake-id → verify 404 or redirect
- [ ] Try creating an invoice with amount 0 → should show error
- [ ] Try registering with an already-used email → should show "already exists"

---

## SECTION 8: Loading States

- [ ] Navigate between dashboard pages quickly → verify skeleton loaders appear briefly before content loads
- [ ] Verify skeleton layout matches the actual page structure (stat cards, tables, charts)

---

## Expected Totals Cheat Sheet

Use these to verify data accuracy:

```
Elena (Casa Marina):
  Rooms: 12 (8 occupied, 3 available, 1 maintenance)
  Tenants: 8 active
  Occupancy: 67%
  Revenue (PAID):
    Jan: ₱17,400 | Feb: ₱17,400 | Mar: ₱21,150 | Apr: ₱14,400
    Total: ₱70,350
  Pending invoices: 4 | Overdue: 1

Roberto (Sunrise Hub):
  Rooms: 5 (4 occupied, 1 available)
  Tenants: 4 active
  Occupancy: 80%
  Revenue: Mar ₱13,000 + Apr ₱6,000 = ₱19,000
  Pending: 2

Platform (Admin):
  Owners: 3 (2 verified, 1 pending)
  Houses: 3 (2 published)
  Rooms: 20 (14 occupied, 5 available, 1 maintenance)
  Tenants: 14 active
  Total PAID revenue: ₱89,350
  Subscriptions: 1 Professional, 1 Starter
  Occupancy: 70%
```

---

## Sign-Off

| Section | Pass/Fail | Notes |
|---------|-----------|-------|
| 1. Public Pages | | |
| 2. Authentication | | |
| 3. Owner Dashboard | | |
| 4. Superadmin Portal | | |
| 5. Data Isolation | | |
| 6. Mobile Responsive | | |
| 7. Error Handling | | |
| 8. Loading States | | |

**Tested by:** _______________
**Date:** _______________
**Overall Result:** PASS / FAIL
