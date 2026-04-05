# Post-Launch Features Design Spec

**Date:** 2026-04-06
**Status:** Approved

## Overview

Six features organized in 3 batches by complexity. Each batch is independently deployable.

---

## Batch 1: Mechanical Fixes

### 1.1 ESLint A11y Warning Fixes

**Goal:** Eliminate all 49 ESLint warnings to reach zero-warning builds.

**Two categories of fixes across ~12 files:**

**`label-has-associated-control` (~20 warnings):**
Files: `admin/broadcasts/broadcasts-client.tsx`, `admin/support/support-client.tsx`, `dashboard/properties/[id]/property-detail-client.tsx`, `dashboard/settings/settings-client.tsx`, `dashboard/transfers/transfers-client.tsx`, `dashboard/tenants/tenants-client.tsx`, `find/finder-client.tsx`

Fix: Add `htmlFor="field-{name}"` to each `<label>` and `id="field-{name}"` to the corresponding `<input>`/`<select>`/`<textarea>`.

**`click-events-have-key-events` + `no-static-element-interactions` (~20 warnings):**
Files: `admin/broadcasts/broadcasts-client.tsx`, `admin/layout.tsx`, `admin/owners/owners-client.tsx`, `dashboard/dashboard-layout-client.tsx`, `dashboard/contracts/contracts-client.tsx`, `dashboard/invoices/invoices-client.tsx`, `dashboard/properties/properties-client.tsx`, `dashboard/tenants/tenants-client.tsx`, `components/ui/tenant-profile-modal.tsx`

Fix: For `<div>` elements with `onClick`:
- Modal backdrops: add `role="presentation"` and `onKeyDown` for Escape
- Interactive divs (sidebar profile, etc.): change to `<button>` or add `role="button"`, `tabIndex={0}`, and `onKeyDown` handler that triggers on Enter/Space

**No behavior changes.** Pure accessibility and lint compliance.

### 1.2 Replace `<img>` with `next/image`

**Goal:** Fix the `@next/next/no-img-element` warning and get image optimization.

**File:** `src/app/find/finder-client.tsx` line ~214

**Change:** Replace `<img src={bh.coverImage}>` with `<Image>` from `next/image`. Add `width`, `height`, `alt` attributes. Configure `remotePatterns` in `next.config.ts` to allow the image domain (currently `images.unsplash.com` based on existing config).

---

## Batch 2: Feature Work

### 2.1 Settings Page — Profile Update

**Goal:** Wire the existing profile form to actually save changes.

**New files:**
- `src/lib/actions/user.ts` �� `updateUser(userId, { name, email, phone })` function
- `src/lib/actions/user.test.ts` — tests for updateUser

**Modified files:**
- `src/app/actions/dashboard.ts` — new `updateProfileAction` server action
- `src/app/dashboard/settings/settings-client.tsx` — wire form to server action

**updateUser behavior:**
- Validates with Zod: name required (min 1), email required (valid format), phone optional
- Checks email uniqueness (exclude current user)
- Updates user record via Prisma
- Returns `{ success: true, user }` or `{ success: false, error }`

**UI behavior:**
- Remove `disabled` from name, email, phone inputs
- Remove `disabled` and "(Coming Soon)" from Save button
- On submit: call `updateProfileAction` with form data
- On success: toast "Profile updated", revalidate dashboard layout
- On error: toast with error message

### 2.2 Settings Page — Password Change

**Goal:** Wire the password change form.

**New files:**
- `src/lib/auth/change-password.ts` — `changePassword(userId, currentPassword, newPassword)` function
- `src/lib/auth/change-password.test.ts` — tests

**Modified files:**
- `src/app/actions/dashboard.ts` — new `changePasswordAction` server action
- `src/app/dashboard/settings/settings-client.tsx` — wire password form

**changePassword behavior:**
- Fetch user from DB, verify current password with bcrypt
- Validate new password with same rules as registration: min 8, max 72, 1 uppercase, 1 number
- Hash new password, update user record
- Returns `{ success: true }` or `{ success: false, error }`

**UI behavior:**
- Remove `disabled` from the three password inputs
- Remove `disabled` and "(Coming Soon)" from Update Password button
- On submit: call `changePasswordAction`
- On success: toast "Password updated", clear all three fields
- On error: toast with error (wrong current password, validation failure)

**Still Coming Soon:** Notification preferences, Change Plan, 2FA — unchanged.

### 2.3 Tenant Edit Flow

**Goal:** Dedicated edit modal for tenants, separate from the view modal.

**Modified files:**
- `src/app/dashboard/tenants/tenants-client.tsx` — add edit modal, re-add edit button

**State:**
- New `editTenantId: string | null` state
- Edit button (pencil icon) in both desktop and mobile rows sets `editTenantId`

**Edit modal:**
- Inline in `tenants-client.tsx` (same pattern as Add Tenant modal)
- Pre-filled from the `tenants` array (no extra fetch)
- Fields: name, phone, email, tenant type, emergency contact, emergency phone
- Hidden input with tenant ID
- On submit: call existing `editTenant` server action
- On success: toast + `router.refresh()` + close modal
- ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape handler, `htmlFor`/`id` pairs

**Not in scope:** Status changes remain in the "More options" dropdown menu.

---

## Batch 3: New Capabilities

### 3.1 Invoice PDF Generation

**Goal:** Generate downloadable PDF invoices with boarding house branding.

**Dependencies:** `@react-pdf/renderer` (new dependency)

**New files:**
- `src/lib/services/invoice-pdf.ts` ��� `generateInvoicePDF(invoiceId): Promise<Buffer>`
- `src/lib/services/invoice-pdf.test.ts` — test that returns a valid Buffer
- `src/app/api/invoices/[id]/pdf/route.ts` — GET endpoint, auth-protected

**generateInvoicePDF behavior:**
1. Query invoice with tenant + boardingHouse + room relations
2. Build a React PDF document with:
   - Header: boarding house name, address, contact phone/email
   - Invoice details: invoice number, created date, due date, status
   - Tenant info: name, room number
   - Line item: type, description, amount
   - Footer: "Generated by Phase", generation timestamp
3. Render to Buffer and return

**API route behavior:**
- `GET /api/invoices/[id]/pdf`
- Read session from cookies, verify OWNER role
- Query invoice's boardingHouseId, verify ownership
- Call `generateInvoicePDF(id)`
- Return with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="invoice-{number}.pdf"`

**UI integration:**
- Add "Download PDF" button (Download icon) to invoice action buttons in `invoices-client.tsx`
- `onClick`: `window.open(\`/api/invoices/${id}/pdf\`)`

### 3.2 E2E Tests with Playwright

**Goal:** Automated browser tests for 5 critical user flows.

**Dependencies:** `@playwright/test` (new devDependency)

**New files:**
- `playwright.config.ts` — Chromium only, base URL `http://localhost:3000`, webServer runs `npm run dev`
- `e2e/login.spec.ts`
- `e2e/create-tenant.spec.ts`
- `e2e/create-invoice.spec.ts`
- `e2e/pay-invoice.spec.ts`
- `e2e/admin-impersonation.spec.ts`
- `e2e/global-setup.ts` — runs `prisma db seed` for consistent test data

**New scripts in package.json:**
- `"test:e2e": "playwright test"`
- `"test:e2e:ui": "playwright test --ui"`

**Test specifications:**

**login.spec.ts:**
- Valid owner (elena@phase.com / Password1) → redirected to `/dashboard`
- Invalid password → stays on `/login`, error message visible
- Valid admin (admin@phase.com / Password1) → redirected to `/admin`

**create-tenant.spec.ts:**
- Login as Elena → navigate to `/dashboard/tenants` → click "Add Tenant" → fill name, phone → submit → verify tenant name appears in table

**create-invoice.spec.ts:**
- Login as Elena → navigate to `/dashboard/invoices` → click "Create Invoice" → select tenant, type, amount, due date → submit → verify invoice appears in list

**pay-invoice.spec.ts:**
- Login as Elena → navigate to `/dashboard/invoices` → find a PENDING invoice → click "Mark Paid" → verify status changes to PAID

**admin-impersonation.spec.ts:**
- Login as admin → navigate to `/admin/owners` → click impersonate on Elena → verify impersonation banner on `/dashboard` → click "Return to Admin" → verify at `/admin`

**Test data:** Seed data provides all necessary accounts, properties, tenants, and invoices. Global setup reseeds before each test suite run.
