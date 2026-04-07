# Post-Launch Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 6 post-launch features across 3 batches: ESLint a11y fixes + next/image, settings page + tenant edit, invoice PDF + E2E tests.

**Architecture:** Each batch is independently deployable. Batch 1 is pure lint/accessibility fixes. Batch 2 adds server actions + lib functions for settings and tenant edit. Batch 3 adds a new PDF generation dependency and Playwright E2E tests.

**Tech Stack:** TypeScript, Next.js 15, Prisma 6, Vitest 4, @react-pdf/renderer (new), @playwright/test (new)

---

## Batch 1: Mechanical Fixes

### Task 1: Fix ESLint a11y warnings — label associations

Fix all `jsx-a11y/label-has-associated-control` warnings (21 total) across 8 files by adding `htmlFor`/`id` pairs.

**Files:**
- Modify: `src/app/admin/broadcasts/broadcasts-client.tsx` (lines 261, 273, 287, 302)
- Modify: `src/app/admin/support/support-client.tsx` (line 382)
- Modify: `src/app/dashboard/properties/[id]/property-detail-client.tsx` (lines 489, 499, 510, 523, 534)
- Modify: `src/app/dashboard/settings/settings-client.tsx` (lines 156, 173, 190)
- Modify: `src/app/dashboard/transfers/transfers-client.tsx` (lines 121, 147, 180, 212, 233)
- Modify: `src/app/dashboard/tenants/tenants-client.tsx` (line 567)
- Modify: `src/app/find/finder-client.tsx` (line 141)
- Modify: `src/app/dashboard/properties/properties-client.tsx` (line 583)

- [ ] **Step 1: Fix label associations in all 8 files**

For each `<label>` warning, add `htmlFor="field-{descriptive-name}"` to the label and `id="field-{descriptive-name}"` to the corresponding input/select/textarea. Read each file, find the exact label elements at the reported lines, and add the associations. Use unique IDs per file context (e.g., `field-broadcast-title`, `field-transfer-tenant`, `field-settings-name`, etc.).

- [ ] **Step 2: Verify warnings are gone**

Run: `npx eslint src/ 2>&1 | grep "label-has-associated-control" | wc -l`
Expected: 0

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "fix(a11y): add htmlFor/id associations to all form labels"
```

---

### Task 2: Fix ESLint a11y warnings — interactive elements

Fix all `jsx-a11y/click-events-have-key-events` and `jsx-a11y/no-static-element-interactions` warnings (26 total, 13 pairs) across 8 files.

**Files:**
- Modify: `src/app/admin/broadcasts/broadcasts-client.tsx` (line 240)
- Modify: `src/app/admin/layout.tsx` (line 107)
- Modify: `src/app/admin/owners/owners-client.tsx` (line 191)
- Modify: `src/app/dashboard/dashboard-layout-client.tsx` (lines 76, 154)
- Modify: `src/app/dashboard/contracts/contracts-client.tsx` (lines 452, 453)
- Modify: `src/app/dashboard/invoices/invoices-client.tsx` (lines 471, 472)
- Modify: `src/app/dashboard/properties/properties-client.tsx` (lines 543, 544, 613, 614)
- Modify: `src/app/dashboard/tenants/tenants-client.tsx` (lines 546, 547)
- Modify: `src/components/ui/tenant-profile-modal.tsx` (line 98)

- [ ] **Step 1: Read each file and fix the interactive element warnings**

Two patterns to apply based on what the element does:

**Modal backdrop overlays** (the `<div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={...}>` pattern in contracts, invoices, properties, tenants): Add `role="presentation"` to these divs. They are not interactive elements — they're click-to-dismiss overlays.

**Clickable non-button divs** (sidebar profile dropdown in dashboard-layout-client, admin layout overlay, broadcasts, owners, tenant-profile-modal): Either change the `<div>` to a `<button>` element (preferred if it's truly interactive), or add `role="button"`, `tabIndex={0}`, and `onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); /* same handler as onClick */ } }}`.

**Outer modal wrappers** (the `<div className="fixed inset-0 z-50 ...">` that already have `onKeyDown` from previous a11y work): Add `role="dialog"` if not already present.

- [ ] **Step 2: Verify warnings are gone**

Run: `npx eslint src/ 2>&1 | grep -E "click-events-have-key|no-static-element" | wc -l`
Expected: 0

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "fix(a11y): add keyboard handlers and roles to interactive elements"
```

---

### Task 3: Replace `<img>` with `next/image`

Fix the `@next/next/no-img-element` warning in the public finder.

**Files:**
- Modify: `src/app/find/finder-client.tsx` (line 214)

- [ ] **Step 1: Replace the img tag**

In `src/app/find/finder-client.tsx`, at line 214, replace:

```tsx
<img
  src={bh.coverImage}
  alt={bh.name}
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
/>
```

With:

```tsx
<Image
  src={bh.coverImage}
  alt={bh.name}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  className="object-cover group-hover:scale-105 transition-transform duration-500"
/>
```

Add the import at the top of the file: `import Image from "next/image";`

The parent div (`<div className="relative aspect-[4/3] ...">`) already has `relative` and explicit aspect ratio, so `fill` will work correctly.

- [ ] **Step 2: Verify no ESLint warnings remain**

Run: `npx eslint src/ 2>&1 | grep -c "warning"`
Expected: 0 (or just the module type Node.js warning, not ESLint rule warnings)

- [ ] **Step 3: Run build**

Run: `npx next build`
Expected: Clean build, 0 errors, 0 ESLint warnings

- [ ] **Step 4: Commit**

```bash
git add src/app/find/finder-client.tsx && git commit -m "fix: replace raw img with next/image in finder for optimization"
```

---

## Batch 2: Feature Work

### Task 4: Create `updateUser` lib function with tests

**Files:**
- Create: `src/lib/actions/user.ts`
- Create: `src/lib/actions/user.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/actions/user.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

let userId: string;

beforeEach(async () => {
  await cleanupTestDb();
  const hash = await hashPassword("Test123456");
  const user = await prisma.user.create({
    data: { name: "Test User", email: "test@example.com", password: hash, role: "OWNER" },
  });
  userId = user.id;
});

afterAll(async () => {
  await cleanupTestDb();
  await disconnectTestDb();
});

describe("updateUser", () => {
  it("updates name successfully", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "New Name", email: "test@example.com" });
    expect(result.success).toBe(true);
    expect(result.user!.name).toBe("New Name");
  });

  it("updates email successfully", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test User", email: "new@example.com" });
    expect(result.success).toBe(true);
    expect(result.user!.email).toBe("new@example.com");
  });

  it("rejects empty name", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "", email: "test@example.com" });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects invalid email", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate email", async () => {
    const hash = await hashPassword("Test123456");
    await prisma.user.create({
      data: { name: "Other", email: "other@example.com", password: hash, role: "OWNER" },
    });
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test", email: "other@example.com" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });

  it("allows keeping the same email", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Updated", email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("updates phone", async () => {
    const { updateUser } = await import("./user");
    const result = await updateUser(userId, { name: "Test User", email: "test@example.com", phone: "09171234567" });
    expect(result.success).toBe(true);
    expect(result.user!.phone).toBe("09171234567");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/actions/user.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `updateUser`**

Create `src/lib/actions/user.ts`:

```typescript
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type UpdateUserInput = z.infer<typeof updateUserSchema>;

export async function updateUser(userId: string, input: UpdateUserInput) {
  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const { name, email, phone } = parsed.data;

  // Check email uniqueness (exclude current user)
  const existing = await prisma.user.findFirst({
    where: { email, id: { not: userId } },
  });
  if (existing) {
    return { success: false as const, error: "A user with this email already exists" };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email, phone: phone || null },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  return { success: true as const, user };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/actions/user.test.ts`
Expected: All 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/user.ts src/lib/actions/user.test.ts
git commit -m "feat: add updateUser function with validation and email uniqueness"
```

---

### Task 5: Create `changePassword` lib function with tests

**Files:**
- Create: `src/lib/auth/change-password.ts`
- Create: `src/lib/auth/change-password.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/auth/change-password.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./password";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

let userId: string;

beforeEach(async () => {
  await cleanupTestDb();
  const hash = await hashPassword("OldPass123");
  const user = await prisma.user.create({
    data: { name: "Test", email: "test@pw.com", password: hash, role: "OWNER" },
  });
  userId = user.id;
});

afterAll(async () => {
  await cleanupTestDb();
  await disconnectTestDb();
});

describe("changePassword", () => {
  it("changes password when current password is correct", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "NewPass456");
    expect(result.success).toBe(true);

    // Verify new password works
    const user = await prisma.user.findUnique({ where: { id: userId } });
    expect(await verifyPassword("NewPass456", user!.password)).toBe(true);
  });

  it("rejects wrong current password", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "WrongPass1", "NewPass456");
    expect(result.success).toBe(false);
    expect(result.error).toContain("current password");
  });

  it("rejects new password that is too short", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "Sh1");
    expect(result.success).toBe(false);
  });

  it("rejects new password without uppercase", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "newpass123");
    expect(result.success).toBe(false);
  });

  it("rejects new password without number", async () => {
    const { changePassword } = await import("./change-password");
    const result = await changePassword(userId, "OldPass123", "NewPassNoNum");
    expect(result.success).toBe(false);
  });

  it("rejects new password over 72 characters", async () => {
    const { changePassword } = await import("./change-password");
    const longPass = "A1" + "a".repeat(71);
    const result = await changePassword(userId, "OldPass123", longPass);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/auth/change-password.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `changePassword`**

Create `src/lib/auth/change-password.ts`:

```typescript
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword } from "./password";

const newPasswordSchema = z
  .string()
  .min(8, "Minimum 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });
  if (!user) {
    return { success: false as const, error: "User not found" };
  }

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    return { success: false as const, error: "Incorrect current password" };
  }

  const parsed = newPasswordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.errors[0].message };
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return { success: true as const };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/auth/change-password.test.ts`
Expected: All 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/change-password.ts src/lib/auth/change-password.test.ts
git commit -m "feat: add changePassword function with current password verification"
```

---

### Task 6: Wire settings page to server actions

**Files:**
- Modify: `src/app/actions/dashboard.ts` (add `updateProfileAction`, `changePasswordAction`)
- Modify: `src/app/dashboard/settings/settings-client.tsx` (wire forms)

- [ ] **Step 1: Add server actions to dashboard.ts**

Add at the end of `src/app/actions/dashboard.ts`:

```typescript
// ── Settings Actions ──────────────────────────────────────

export async function updateProfileAction(formData: FormData) {
  const user = await requireOwner();
  const { updateUser } = await import("@/lib/actions/user");
  const result = await updateUser(user.id, {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
  });
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
  }
  return result;
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireOwner();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" };
  }

  const { changePassword } = await import("@/lib/auth/change-password");
  return changePassword(user.id, currentPassword, newPassword);
}
```

- [ ] **Step 2: Wire the settings client component**

Rewrite `src/app/dashboard/settings/settings-client.tsx` to:

1. Add imports: `import { useTransition } from "react"`, `import { useRouter } from "next/navigation"`, `import { useToast } from "@/components/ui/toast"`, `import { updateProfileAction, changePasswordAction } from "@/app/actions/dashboard"`
2. Add state: `const [isPending, startTransition] = useTransition()`, `const router = useRouter()`, `const { showToast } = useToast()`
3. Profile form: remove `disabled` from the 3 inputs, change the form to use `<form>` with `name` attributes on inputs (`name="name"`, `name="email"`, `name="phone"`), add `onSubmit` handler that calls `updateProfileAction` via `startTransition`, show toast on success/error, call `router.refresh()` on success
4. Password form: remove `disabled` from the 3 password inputs, add `name` attributes (`name="currentPassword"`, `name="newPassword"`, `name="confirmPassword"`), wrap in `<form>`, add `onSubmit` handler that calls `changePasswordAction`, show toast, clear form on success via `form.reset()`
5. Remove "(Coming Soon)" from Save Changes and Update Password buttons, re-enable them
6. Keep Notifications, Change Plan, and 2FA as-is (Coming Soon)

- [ ] **Step 3: Build and verify**

Run: `npx next build`
Expected: Clean build

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (including new user and change-password tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/dashboard.ts src/app/dashboard/settings/settings-client.tsx
git commit -m "feat: wire settings page profile update and password change"
```

---

### Task 7: Add tenant edit modal

**Files:**
- Modify: `src/app/dashboard/tenants/tenants-client.tsx`

- [ ] **Step 1: Add edit state and re-add edit button**

In `src/app/dashboard/tenants/tenants-client.tsx`:

1. Add `import { Edit } from "lucide-react"` back to the icon imports
2. Add state: `const [editTenantId, setEditTenantId] = useState<string | null>(null)`
3. Add `import { editTenant } from "@/app/actions/dashboard"` to imports
4. Re-add the Edit button in the desktop table actions (after the View button) and mobile card actions:

```tsx
<button
  onClick={() => setEditTenantId(tenant.id)}
  className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
  title="Edit tenant"
>
  <Edit className="h-4 w-4" />
</button>
```

- [ ] **Step 2: Add the edit modal**

Add before the `TenantProfileModal` at the bottom of the component. Find the tenant from the existing array:

```tsx
{/* Edit Tenant Modal */}
{editTenantId && (() => {
  const tenant = tenants.find((t) => t.id === editTenantId);
  if (!tenant) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={(e) => { if (e.key === "Escape") setEditTenantId(null); }}
    >
      <div
        className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
        role="presentation"
        onClick={() => setEditTenantId(null)}
      />
      <div
        className="relative bg-surface-container-lowest rounded-2xl shadow-[0_20px_40px_-8px_rgba(24,28,30,0.12)] w-full max-w-md animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title-edit-tenant"
      >
        <div className="gradient-primary px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 id="modal-title-edit-tenant" className="text-lg font-semibold font-[family-name:var(--font-display)] text-on-primary">Edit Tenant</h2>
          <button onClick={() => setEditTenantId(null)} className="text-on-primary/70 hover:text-on-primary"><X size={20} /></button>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          startTransition(async () => {
            const fd = new FormData(e.currentTarget);
            fd.set("id", editTenantId);
            const result = await editTenant(fd);
            if (result.success) {
              showToast("Tenant updated successfully", "success");
              setEditTenantId(null);
              router.refresh();
            } else {
              showToast(result.error || "Failed to update tenant", "error");
            }
          });
        }} className="p-6 space-y-4">
          <div>
            <label htmlFor="edit-tenant-name" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Full Name *</label>
            <input id="edit-tenant-name" name="name" type="text" required defaultValue={tenant.name} className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label htmlFor="edit-tenant-phone" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Phone *</label>
            <input id="edit-tenant-phone" name="phone" type="tel" required defaultValue={tenant.phone} className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label htmlFor="edit-tenant-email" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Email</label>
            <input id="edit-tenant-email" name="email" type="email" defaultValue={tenant.email || ""} className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Tenant Type</label>
            <div className="flex gap-2">
              {[
                { value: "STUDENT", label: "Student" },
                { value: "WORKING_PROFESSIONAL", label: "Working Professional" },
                { value: "OTHER", label: "Other" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-1.5 text-sm text-on-surface cursor-pointer">
                  <input type="radio" name="tag" value={opt.value} defaultChecked={tenant.tag === opt.value} className="accent-primary" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-tenant-ec" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Emergency Contact</label>
              <input id="edit-tenant-ec" name="emergencyContact" type="text" defaultValue={tenant.emergencyContact || ""} className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label htmlFor="edit-tenant-ep" className="block text-xs font-medium text-on-surface-variant uppercase tracking-wide mb-1.5">Emergency Phone</label>
              <input id="edit-tenant-ep" name="emergencyPhone" type="tel" defaultValue={tenant.emergencyPhone || ""} className="w-full px-4 py-2.5 bg-surface-container rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div className="bg-surface-container-low px-6 py-4 -mx-6 -mb-6 mt-4 flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={() => setEditTenantId(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="gradient-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center gap-2">
              <Save size={16} />
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
})()}
```

Add `import { Save } from "lucide-react"` to the imports if not present.

- [ ] **Step 3: Verify the tenant type includes `tag` and `emergencyContact`/`emergencyPhone` in the component's `Tenant` type**

Read the `Tenant` type definition at the top of `tenants-client.tsx`. If it doesn't include `tag`, `emergencyContact`, `emergencyPhone`, add them. Also check the server page `src/app/dashboard/tenants/page.tsx` to ensure these fields are included in the Prisma query.

- [ ] **Step 4: Build**

Run: `npx next build`
Expected: Clean build

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/tenants/tenants-client.tsx
git commit -m "feat: add tenant edit modal with pre-filled form"
```

---

## Batch 3: New Capabilities

### Task 8: Install @react-pdf/renderer and create invoice PDF generator

**Files:**
- Create: `src/lib/services/invoice-pdf.tsx`
- Create: `src/lib/services/invoice-pdf.test.ts`

- [ ] **Step 1: Install dependency**

Run: `npm install @react-pdf/renderer`

- [ ] **Step 2: Write failing test**

Create `src/lib/services/invoice-pdf.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createBoardingHouse } from "@/lib/actions/boarding-house";
import { createRoom } from "@/lib/actions/room";
import { createTenant } from "@/lib/actions/tenant";
import { createInvoice } from "@/lib/actions/invoice";
import { cleanupTestDb, disconnectTestDb } from "@/test/db";

let invoiceId: string;

beforeEach(async () => {
  await cleanupTestDb();
  const hash = await hashPassword("Test123456");
  const owner = await prisma.user.create({
    data: { name: "PDF Owner", email: "pdf@test.com", password: hash, role: "OWNER" },
  });
  const house = await createBoardingHouse({
    name: "PDF Test House",
    address: "123 Test St, Mati City",
    type: "MIXED",
    ownerId: owner.id,
    contactPhone: "0917-000-0000",
    contactEmail: "house@test.com",
  });
  const room = await createRoom({
    number: "PDF-1",
    floor: 1,
    capacity: 1,
    monthlyRate: 5000,
    boardingHouseId: house.boardingHouse!.id,
  });
  const tenant = await createTenant({
    name: "PDF Tenant",
    phone: "0917-111-0000",
    boardingHouseId: house.boardingHouse!.id,
    roomId: room.room!.id,
  });
  const invoice = await createInvoice({
    tenantId: tenant.tenant!.id,
    boardingHouseId: house.boardingHouse!.id,
    amount: 5000,
    type: "RENT",
    dueDate: new Date("2026-06-01"),
    description: "Rent for June 2026",
  });
  invoiceId = invoice.invoice!.id;
});

afterAll(async () => {
  await cleanupTestDb();
  await disconnectTestDb();
});

describe("generateInvoicePDF", () => {
  it("returns a Buffer for a valid invoice", async () => {
    const { generateInvoicePDF } = await import("./invoice-pdf");
    const buffer = await generateInvoicePDF(invoiceId);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(buffer.toString("ascii", 0, 4)).toBe("%PDF");
  });

  it("throws for non-existent invoice", async () => {
    const { generateInvoicePDF } = await import("./invoice-pdf");
    await expect(generateInvoicePDF("nonexistent-id")).rejects.toThrow("Invoice not found");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/services/invoice-pdf.test.ts`
Expected: FAIL

- [ ] **Step 4: Implement invoice PDF generator**

Create `src/lib/services/invoice-pdf.tsx`:

```tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },
  header: { marginBottom: 30 },
  houseName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  houseAddress: { fontSize: 10, color: "#555" },
  houseContact: { fontSize: 9, color: "#777", marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ddd", marginVertical: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 9, color: "#777", textTransform: "uppercase" },
  value: { fontSize: 11 },
  amountSection: { marginTop: 20, padding: 15, backgroundColor: "#f7f9fc", borderRadius: 4 },
  amountLabel: { fontSize: 10, color: "#555" },
  amountValue: { fontSize: 22, fontWeight: "bold", marginTop: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999", textAlign: "center" },
  statusBadge: { fontSize: 10, fontWeight: "bold", padding: "3 8", borderRadius: 4 },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

type InvoiceData = {
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  paidDate: Date | null;
  status: string;
  type: string;
  description: string | null;
  createdAt: Date;
  tenant: { name: string; room: { number: string } | null };
  boardingHouse: { name: string; address: string; contactPhone: string | null; contactEmail: string | null };
};

function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.houseName}>{invoice.boardingHouse.name}</Text>
          <Text style={styles.houseAddress}>{invoice.boardingHouse.address}</Text>
          {invoice.boardingHouse.contactPhone && (
            <Text style={styles.houseContact}>Tel: {invoice.boardingHouse.contactPhone}</Text>
          )}
          {invoice.boardingHouse.contactEmail && (
            <Text style={styles.houseContact}>Email: {invoice.boardingHouse.contactEmail}</Text>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Invoice Number</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          <View>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.statusBadge}>{invoice.status}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Date Issued</Text>
            <Text style={styles.value}>{formatDate(invoice.createdAt)}</Text>
          </View>
          <View>
            <Text style={styles.label}>Due Date</Text>
            <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        {invoice.paidDate && (
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Paid Date</Text>
              <Text style={styles.value}>{formatDate(invoice.paidDate)}</Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Tenant</Text>
            <Text style={styles.value}>{invoice.tenant.name}</Text>
          </View>
          <View>
            <Text style={styles.label}>Room</Text>
            <Text style={styles.value}>{invoice.tenant.room ? `Room ${invoice.tenant.room.number}` : "N/A"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{invoice.type}</Text>
          </View>
          <View>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{invoice.description || "-"}</Text>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>{formatCurrency(invoice.amount)}</Text>
        </View>

        <Text style={styles.footer}>
          Generated by Phase on {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: { select: { name: true, room: { select: { number: true } } } },
      boardingHouse: { select: { name: true, address: true, contactPhone: true, contactEmail: true } },
    },
  });

  if (!invoice) throw new Error("Invoice not found");

  const buffer = await renderToBuffer(<InvoiceDocument invoice={invoice} />);
  return Buffer.from(buffer);
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/lib/services/invoice-pdf.test.ts`
Expected: 2 tests pass

- [ ] **Step 6: Commit**

```bash
git add src/lib/services/invoice-pdf.tsx src/lib/services/invoice-pdf.test.ts package.json package-lock.json
git commit -m "feat: add invoice PDF generator with @react-pdf/renderer"
```

---

### Task 9: Add PDF download API route and UI button

**Files:**
- Create: `src/app/api/invoices/[id]/pdf/route.ts`
- Modify: `src/app/dashboard/invoices/invoices-client.tsx`

- [ ] **Step 1: Create the API route**

Create `src/app/api/invoices/[id]/pdf/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF } from "@/lib/services/invoice-pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("phase-session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await verifyToken(token);
  if (!session || session.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ownership check
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { invoiceNumber: true, boardingHouse: { select: { ownerId: true } } },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (invoice.boardingHouse.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = await generateInvoicePDF(id);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add Download PDF button to invoices client**

In `src/app/dashboard/invoices/invoices-client.tsx`, add `import { Download } from "lucide-react"` to the icon imports.

Find the invoice action buttons area (where Eye, Send, etc. are rendered for each invoice). Add a Download PDF button:

```tsx
<button
  onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`)}
  className="rounded-lg p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container"
  title="Download PDF"
>
  <Download className="h-4 w-4" />
</button>
```

- [ ] **Step 3: Build**

Run: `npx next build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add src/app/api/invoices/[id]/pdf/route.ts src/app/dashboard/invoices/invoices-client.tsx
git commit -m "feat: add invoice PDF download endpoint and UI button"
```

---

### Task 10: Set up Playwright and write E2E tests

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/global-setup.ts`
- Create: `e2e/login.spec.ts`
- Create: `e2e/create-tenant.spec.ts`
- Create: `e2e/create-invoice.spec.ts`
- Create: `e2e/pay-invoice.spec.ts`
- Create: `e2e/admin-impersonation.spec.ts`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Install Playwright**

Run: `npm install -D @playwright/test && npx playwright install chromium`

- [ ] **Step 2: Create Playwright config**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
```

- [ ] **Step 3: Create global setup**

Create `e2e/global-setup.ts`:

```typescript
import { execSync } from "child_process";

export default function globalSetup() {
  execSync("npx prisma db seed", { stdio: "inherit" });
}
```

- [ ] **Step 4: Add scripts to package.json**

Add to the `scripts` section:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 5: Create login test**

Create `e2e/login.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  test("owner can log in and reach dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    await expect(page).toHaveURL("/dashboard");
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "WrongPassword1");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL("/login");
  });

  test("admin can log in and reach admin panel", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");
    await expect(page).toHaveURL("/admin");
  });
});
```

- [ ] **Step 6: Create tenant test**

Create `e2e/create-tenant.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Create tenant", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("can add a new tenant", async ({ page }) => {
    await page.goto("/dashboard/tenants");
    await page.click("text=Add Tenant");
    await page.fill('input[name="name"]', "E2E Test Tenant");
    await page.fill('input[name="phone"]', "0917-999-0001");
    await page.click('button:has-text("Add Tenant")');
    await expect(page.locator("text=E2E Test Tenant")).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 7: Create invoice test**

Create `e2e/create-invoice.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Create invoice", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("can create a new invoice", async ({ page }) => {
    await page.goto("/dashboard/invoices");
    await page.click("text=Create Invoice");
    await page.selectOption('select[name="tenantId"]', { index: 1 });
    await page.selectOption('select[name="type"]', "RENT");
    await page.fill('input[name="amount"]', "5000");
    await page.fill('input[name="dueDate"]', "2026-07-01");
    await page.click('button:has-text("Create Invoice")');
    await expect(page.locator("text=PENDING")).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 8: Create pay invoice test**

Create `e2e/pay-invoice.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Pay invoice", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "elena@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("can mark an invoice as paid", async ({ page }) => {
    await page.goto("/dashboard/invoices");
    // Find a PENDING invoice and click its pay button
    const pendingRow = page.locator("tr", { has: page.locator("text=PENDING") }).first();
    await pendingRow.locator('button[title="Mark as paid"]').click();
    // Wait for status to change
    await expect(page.locator("text=Payment Recorded").or(page.locator("text=PAID"))).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 9: Create admin impersonation test**

Create `e2e/admin-impersonation.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Admin impersonation", () => {
  test("admin can impersonate owner and return", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@phase.com");
    await page.fill('input[name="password"]', "Password1");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");

    // Navigate to owners and impersonate
    await page.goto("/admin/owners");
    await page.click('button:has-text("Impersonate")');
    await page.waitForURL("/dashboard");

    // Verify impersonation banner
    await expect(page.locator("text=admin impersonation")).toBeVisible({ timeout: 5000 });

    // Return to admin
    await page.click("text=Return to Admin");
    await page.waitForURL("/admin");
    await expect(page).toHaveURL("/admin");
  });
});
```

- [ ] **Step 10: Commit**

```bash
git add playwright.config.ts e2e/ package.json package-lock.json
git commit -m "feat: add Playwright E2E tests for 5 critical user flows"
```

---

### Task 11: Final verification

- [ ] **Step 1: Run unit tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run build**

Run: `npx next build`
Expected: Clean build, 0 errors, 0 warnings

- [ ] **Step 3: Run ESLint**

Run: `npx eslint src/`
Expected: 0 errors, 0 warnings

- [ ] **Step 4: Verify all changes**

Run: `git log --oneline` to see all new commits.
