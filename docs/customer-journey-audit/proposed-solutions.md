# PMG Tracker 360: Proposed Technical Solutions

This document presents proposed technical solutions for all findings, security gaps, and operational limitations identified during the Customer Journey Audit. It includes schema designs, code snippets, and architectures to guide developers in resolving these issues.

---

## 1. Solution: Secure Server Actions (Auth & Tenant Validation)

### Problem:
Server actions in [tenders.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/tenders.ts), [clients.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/clients.ts), and [projects.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/projects.ts) do not validate if the user is authenticated and belongs to the organization whose ID is passed in the request. 

Furthermore, server actions in [purchase-orders.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/purchase-orders.ts) and [documents.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/documents.ts) check general session permissions but fail to verify that the target `organizationId` matching the database query is the user's active session organization, leading to cross-tenant access vulnerabilities.

### Solution:
Introduce a reusable validation helper `validateSessionAndOrg` that performs session verification and confirms organization membership using the Better Auth instance. Wrap all mutation and query server actions with this helper.

#### Implementation Template (`apps/tracker/src/server/utils.ts`):
```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { member } from '@pmg/db/schema';
import { and, eq } from 'drizzle-orm';

export async function validateSessionAndOrg(organizationId: string) {
  // 1. Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw new Error('Authentication required');
  }

  // 2. Validate user is a member of the target organization
  const membership = await db
    .select()
    .from(member)
    .where(
      and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    throw new Error('Access denied: User is not a member of this organization');
  }

  return {
    userId: session.user.id,
    session,
    role: membership[0].role, // owner, admin, manager, member
  };
}
```

#### Refactoring Server Actions Example (`apps/tracker/src/server/clients.ts`):
```typescript
// Before:
// export async function createClient(organizationId: string, data: ClientCreateInput) { ... }

// After:
import { validateSessionAndOrg } from './utils';

export async function createClient(
  organizationId: string,
  data: ClientCreateInput
) {
  try {
    // 1. Auth and Tenant check
    const { userId } = await validateSessionAndOrg(organizationId);

    // 2. Validate input
    const validatedData = ClientCreateSchema.parse(data);

    const newClient = await db
      .insert(client)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        ...validatedData,
      })
      .returning();

    revalidatePath('/dashboard/clients');
    return { success: true, client: newClient[0] };
  } catch (error: any) {
    console.error('Error creating client:', error);
    return { success: false, error: error.message || 'Failed to create client' };
  }
}
```

---

## 2. Solution: Active Organization Switcher Fix

### Problem:
The organization selection screen in the UI does not trigger Better Auth's `setActive` command, causing the active organization context to remain out-of-sync.

### Solution:
Bind the organization buttons in [organization-selector.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/organization-selector.tsx) to a click handler that calls `authClient.organization.setActive` before routing the user to the dashboard.

#### Corrected Component Snippet:
```typescript
import { useRouter } from 'next/navigation';

export function OrganizationSelector({
  organizations,
  fallbackContent,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelectOrg = async (orgId: string) => {
    setIsSwitching(true);
    try {
      // Correctly set the active organization in Better Auth session
      await authClient.organization.setActive({
        organizationId: orgId,
      });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Failed to switch organization:', err);
      setIsSwitching(false);
    }
  };

  return (
    <div className="grid gap-3">
      {organizations.map((org) => (
        <Button
          key={org.id}
          variant={activeOrganization?.id === org.id ? 'default' : 'outline'}
          className="w-full justify-start cursor-pointer"
          onClick={() => handleSelectOrg(org.id)}
          disabled={isSwitching}
        >
          <span className="font-medium">{org.name}</span>
        </Button>
      ))}
    </div>
  );
}
```

---

## 3. Solution: Correct Organization Slug URL Preview

### Problem:
The URL Preview in the organization creation form, [create-organization-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/shared/forms/create-organization-form.tsx#L475-L484), shows a non-existent path (`/dashboard/settings/organization/{slug}`).

### Solution:
Modify the preview component inside [create-organization-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/shared/forms/create-organization-form.tsx) to render the correct `/dashboard/organization/{slug}` path.

#### Form File Code Modification:
```diff
                 {/* URL Preview */}
                 {field.value && (
                   <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                     <span className="text-xs text-muted-foreground">
                       URL Preview:
                     </span>
                     <Badge variant="secondary" className="text-xs font-mono">
-                      /dashboard/settings/organization/{field.value}
+                      /dashboard/organization/{field.value}
                     </Badge>
                   </div>
                 )}
```

---

## 4. Solution: Add the Missing `invoice` Table

### Problem:
The application lacks an `invoice` table to track PO fulfillment billing, payment cycles, and overdue ZAR balances.

### Solution:
Add the singular `invoice` table schema definition to the package `@pmg/db` schema file, configure foreign keys matching the text ID convention, define Drizzle relations, and execute a migration.

#### Database Schema Extension (`packages/db/src/schema.ts`):
```typescript
/* =========================
   INVOICE MANAGEMENT
========================= */
export const invoice = pgTable('invoice', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  projectId: text('project_id')
    .notNull()
    .references(() => project.id, { onDelete: 'cascade' }),
  purchaseOrderId: text('purchase_order_id')
    .references(() => purchaseOrder.id, { onDelete: 'set null' }), // Optional link
  invoiceNumber: text('invoice_number').notNull(), // User input unique number
  description: text('description').notNull(),
  amount: text('amount').notNull(), // String ZAR value (consistent with PO totalAmount)
  taxAmount: text('tax_amount').default('0').notNull(), // VAT amount
  status: text('status').default('draft').notNull(), // draft, sent, paid, overdue, cancelled
  issueDate: timestamp('issue_date'),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdBy: text('created_by')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft-delete support
});

export type Invoice = typeof invoice.$inferSelect;

// --- Add to Relations section in packages/db/src/schema.ts ---
export const invoiceRelations = relations(invoice, ({ one }) => ({
  organization: one(organization, {
    fields: [invoice.organizationId],
    references: [organization.id],
  }),
  project: one(project, {
    fields: [invoice.projectId],
    references: [project.id],
  }),
  purchaseOrder: one(purchaseOrder, {
    fields: [invoice.purchaseOrderId],
    references: [purchaseOrder.id],
  }),
  creator: one(user, {
    fields: [invoice.createdBy],
    references: [user.id],
  }),
}));
```

---

## 4. Solution: Rectify the `deliveredAt` PO Form Input

### Problem:
The `deliveredAt` date is excluded from the PO form schema and inputs. When marking status as `'delivered'`, it automatically sets it to the current time, preventing historical records from being input.

### Solution:
1. Update `poFormSchema` in [po-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/purchase-orders/po-form.tsx) to include `deliveredAt`.
2. Add a date picker in the UI form that appears dynamically **only** when the selected status is `'delivered'`.
3. Allow the server action to accept a user-specified `deliveredAt` date.

#### Form Schema Modification in `po-form.tsx`:
```diff
 const poFormSchema = z
   .object({
     poNumber: z.string().min(1, 'PO Number is required'),
     projectId: z.string().min(1, 'Project is required'),
     supplierName: z.string().optional(),
     description: z.string().min(1, 'Description is required'),
     totalAmount: z.string().min(1, 'Total amount is required'),
     status: z.enum(['draft', 'sent', 'delivered']),
     poDate: z.date().optional(),
     expectedDeliveryDate: z.date().optional(),
+    deliveredAt: z.date().optional(),
     deliveryAddress: z.string().optional(),
   })
```

#### Dynamic Date Picker UI in `po-form.tsx`:
```typescript
// Watch status to display field conditionally
const watchStatus = form.watch('status');

{
  watchStatus === 'delivered' && (
    <FormField
      control={form.control}
      name="deliveredAt"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Actual Delivery Date *</FormLabel>
          <FormControl>
            <Input
              type="date"
              value={
                field.value
                  ? new Date(field.value).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0] // Default to today
              }
              onChange={(e) => {
                field.onChange(
                  e.target.value ? new Date(e.target.value) : new Date()
                );
              }}
              disabled={isPending}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

---

## 5. Solution: Enhance the Data Model for Procurement Details

To address CIDB requirements, briefing tracking, compliance check-offs, and PO itemization, the database schema should be enriched.

### A. Clarification & Briefing Session Tracking
Add meeting columns directly to the `tender` table schema in [schema.ts](file:///D:/websites/pmg-tracker-360/packages/db/src/schema.ts):
```typescript
// Inside pgTable('tender', ...)
briefingDate: timestamp('briefing_date'), // Meeting date
briefingLocation: text('briefing_location'), // Venue or MS Teams link
isBriefingMandatory: boolean('is_briefing_mandatory').default(false).notNull(),
briefingAttended: boolean('briefing_attended').default(false).notNull(),
```

### B. Purchase Order Line Items
Create a detailed `purchase_order_item` table for line-item quantities:
```typescript
export const purchaseOrderItem = pgTable('purchase_order_item', {
  id: text('id').primaryKey(),
  purchaseOrderId: text('purchase_order_id')
    .notNull()
    .references(() => purchaseOrder.id, { onDelete: 'cascade' }),
  itemName: text('item_name').notNull(),
  description: text('description'),
  quantity: text('quantity').notNull(), // Quantity as string or numeric
  unitPrice: text('unit_price').notNull(), // Price per unit
  totalAmount: text('total_amount').notNull(), // Calculated total
});
```

---

## 6. Solution: Timezone-Safe Local Date Formatter for Forms

### Problem:
Forms formatting calendar dates using `.toISOString().split('T')[0]` shift dates back by one day for South African users (UTC+2) because `.toISOString()` converts the local midnight timestamp (00:00:00) to UTC (e.g. 22:00:00 the previous day).

### Solution:
Introduce a timezone-safe formatting helper `formatLocalDate` in the frontend utility folder and use it in form date fields to extract the local YYYY-MM-DD components without UTC timezone conversion.

#### Utility Helper (`apps/tracker/src/lib/date-utils.ts`):
```typescript
export function formatLocalDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  // Format as YYYY-MM-DD based on local date values
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

#### Form Implementation Example (`po-form.tsx`):
```typescript
<FormField
  control={form.control}
  name="poDate"
  render={({ field }) => (
    <FormItem>
      <FormLabel>PO Date</FormLabel>
      <FormControl>
        <Input
          type="date"
          {...field}
          value={formatLocalDate(field.value)}
          onChange={(e) => {
            const date = e.target.value
              ? new Date(e.target.value)
              : undefined;
            field.onChange(date);
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 7. Solution: Secure Settings Overview Route

### Problem:
The settings overview route does not perform user session verification, allowing unauthenticated sessions to render the layout with placeholder settings details.

### Solution:
Secure the server component route by calling `getCurrentUser()` to enforce redirect behavior if no valid session is present.

#### Updated Route Code (`apps/tracker/src/app/(dashboard)/settings/overview/page.tsx`):
```typescript
import { getCurrentUser } from '@/server';

export const dynamic = 'force-dynamic';

export default async function SettingsOverviewPage() {
  // Enforce session check and redirect if unauthorized
  await getCurrentUser();

  return (
    <div className="space-y-6">
      {/* Page layout content remains unchanged */}
    </div>
  );
}
```
