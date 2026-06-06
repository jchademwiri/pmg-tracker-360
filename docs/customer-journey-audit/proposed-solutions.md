# PMG Tracker 360: Proposed Technical Solutions

This document presents proposed technical solutions for all findings, security gaps, operational limitations, and UI/UX/Accessibility issues identified during the Customer Journey Audit. It includes schema designs, code snippets, and architectures to guide developers in resolving these issues.

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
<!-- We will not have invoicing at this moment -->
<!-- ## 4. Solution: Add the Missing `invoice` Table

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

--- -->

## 5. Solution: Rectify the `deliveredAt` PO Form Input

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

## 6. Solution: Enhance the Data Model for Procurement Details

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

## 7. Solution: Timezone-Safe Local Date Formatter for Forms

### Problem:
Timezone offsets cause Date values serialized via `.toISOString().split('T')[0]` to shift back by one day for South African users (UTC+2) because midnight local time is represented as 22:00:00 UTC of the previous day.

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

## 8. Solution: Secure Settings Overview Route

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

---

## 9. Solution: Typography Upgrade (Next.js Fonts)

### Problem:
No custom professional typography (e.g. Geist or Inter) is loaded, defaulting styling to Arial and system fallbacks which yields an unpolished, generic look.

### Solution:
Import and configure Next.js fonts in [layout.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/app/layout.tsx) and inject their CSS variables into the root document wrapper.

#### Code Modification (`apps/tracker/src/app/layout.tsx`):
```typescript
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* Children content wrapper */}
      </body>
    </html>
  );
}
```

---

## 10. Solution: Global Skip-Link & Layout Refactoring

### Problem:
`SkipNavigation` is only rendered on the Settings Profile page and targets a layout wrapper that contains the sidebar itself, which fails to skip the sidebar menu.

### Solution:
1. Render `<SkipNavigation>` globally at the top of the dashboard layout wrapper.
2. Refactor the dashboard layout container to use `<main id="main-content" tabIndex={-1}>` for the page contents, skipping the sidebar menu entirely.
3. Replace the redundant `<main>` tag in the root layout with a standard `div` wrapper.

#### Code Modification (`apps/tracker/src/app/(dashboard)/layout.tsx`):
```typescript
import { SkipNavigation } from '@/components/skip-navigation';

export default async function MainDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionCheck = await checkUserSession();
  const skipSections = [{ id: 'main-content', label: 'Main Content' }];

  return (
    <div className="h-screen flex w-full">
      {/* Skip links must be the first focusable elements */}
      <SkipNavigation sections={skipSections} />
      
      <SidebarProvider>
        <AppSidebarWrapper />
        <SidebarInset className="flex-1 flex flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 ...">
            {/* Header Content */}
          </header>
          {/* Main content area wrapped with ID & tabIndex for keyboard focus redirection */}
          <main 
            id="main-content" 
            tabIndex={-1} 
            className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-y-auto focus:outline-none"
          >
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
```

---

## 11. Solution: Reusable Table Skeleton Loader

### Problem:
Table lists show raw text loaders (`"Loading tenders..."`) during asynchronous searches or page switching, causing layout shifts.

### Solution:
Create a reusable `<TableSkeleton />` component in the UI library to display matching skeletal states while data is fetching.

#### Reusable Skeleton Component (`apps/tracker/src/components/ui/table-skeleton.tsx`):
```typescript
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  columnsCount?: number;
  rowsCount?: number;
}

export function TableSkeleton({
  columnsCount = 5,
  rowsCount = 5,
}: TableSkeletonProps) {
  return (
    <div className="rounded-lg border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columnsCount }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowsCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columnsCount }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 12. Solution: Form Error Accessibility and Focus Management Integration

### Problem:
When form submissions fail validation, screen readers are not announced of the failure, and keyboard focus is not moved to the first invalid field, violating WCAG accessibility guidelines.

### Solution:
Wire up `useFormFocusManagement()` inside core forms (e.g. `tender-form.tsx`, `po-form.tsx`, `client-form.tsx`) to trigger focus on validation errors.

#### Form Integration Example (`apps/tracker/src/components/tenders/tender-form.tsx`):
```typescript
import { useFormFocusManagement } from '@/hooks/use-focus-management';

export function TenderForm({ organizationId, tender, mode }: TenderFormProps) {
  const { focusFirstError, announceError } = useFormFocusManagement();

  // Watch for React Hook Form errors and shift focus dynamically
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      focusFirstError(form.formState.errors);
      announceError('Tender form validation failed. Please check the highlighted fields.');
    }
  }, [form.formState.errors]);

  // Form rendering code...
}
```

---

## 13. Solution: South African Rand (ZAR) Currency Input Mask and Prefix

### Problem:
Form currency inputs lack formatting, allowing raw numbers and string entries, and utilize foreign symbols like the Dollar sign.

### Solution:
1. Replace `<DollarSign />` icons in forms with localized `R` or `ZAR` labels.
2. Implement a formatted currency input field that formats input in real time.

#### Form Input Fields Snippet (`tender-form.tsx`):
```typescript
<FormField
  control={form.control}
  name="value"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tender Value</FormLabel>
      <FormControl>
        <div className="relative flex items-center">
          {/* localized prefix */}
          <span className="absolute left-3 text-muted-foreground font-semibold text-sm select-none">
            R
          </span>
          <Input
            type="text"
            placeholder="0.00"
            className="pl-8 rounded-md"
            value={field.value}
            onChange={(e) => {
              // Only allow numbers and decimal points
              const raw = e.target.value.replace(/[^0-9.]/g, '');
              field.onChange(raw);
            }}
            disabled={isPending}
          />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 14. Solution: Resolve Tender Extension Form Block (Missing File Input)

### Problem:
The Tender Extension submission handler rejects submissions without a file attachment, but the UI component fails to render any file input element (only displaying a "coming soon" message), entirely locking the feature.

### Solution:
Integrate a proper file upload form field in [extension-form.tsx](file:///D:/websites/pmg-tracker-360/apps/tracker/src/components/tenders/extension-form.tsx) so that users can select and attach the PDF/image extension letters required by the server action.

#### Form Field Update (`apps/tracker/src/components/tenders/extension-form.tsx`):
```typescript
// Replace the static placeholder block:
<FormField
  control={form.control}
  name="file"
  render={({ field }) => (
    <FormItem className="space-y-2">
      <FormLabel>Extension Letter *</FormLabel>
      <FormControl>
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            field.onChange(file);
          }}
          required
        />
      </FormControl>
      <p className="text-xs text-muted-foreground">
        Upload the official confirmation letter (PDF, Word, or Image up to 10MB)
      </p>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### Submission Handler Modification:
Update the `onSubmit` logic to fetch the file directly from the form state rather than querying the DOM:
```typescript
const onSubmit = async (data: ExtensionFormValues) => {
  const file = data.file;

  if (!file) {
    toast.error('File Required', {
      description: 'Please upload the extension letter.',
    });
    return;
  }

  startTransition(async () => {
    const formData = new FormData();
    formData.append('file', file);

    const input = {
      tenderId,
      extensionDate: data.extensionDate,
      newEvaluationDate: data.newEvaluationDate,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      notes: data.notes,
    };

    const result = await createTenderExtension(organizationId, input, formData);
    // Response handler...
  });
};
```

---

## 12. Solution: Technical SEO & Brand Assets

### Problem:
1. Search engines are not blocked from crawling private, auth-guarded root routes like `/clients`, `/tenders`, `/projects`, `/calendar`, `/reports`, `/settings`, and `/organization`.
2. Public routes like `/blog` and `/careers` are missing from `sitemap.ts`.
3. OpenGraph metadata references a non-existent `/og-image.png` asset and JSON-LD points to a missing `/icon.png` file, degrading social-share representation and structured data compliance.

### Solution:
Refactor `robots.ts` to disallow all private routes, update `sitemap.ts` to include missing public pages and dynamically resolve the baseUrl via environment variables, and create placeholder files in the public directory.

#### Updated robots.ts (`apps/tracker/src/app/robots.ts`):
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tendertrack360.co.za';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/clients/',
        '/tenders/',
        '/projects/',
        '/calendar/',
        '/reports/',
        '/settings/',
        '/organization/',
        '/invite/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

#### Updated sitemap.ts (`apps/tracker/src/app/sitemap.ts`):
```typescript
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tendertrack360.co.za';
  const currentDate = new Date();

  const routes = [
    { url: '', changeFrequency: 'daily', priority: 1.0 },
    { url: '/contact', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/help', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/privacy', changeFrequency: 'yearly', priority: 0.5 },
    { url: '/terms', changeFrequency: 'yearly', priority: 0.5 },
    { url: '/waitlist', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/modules', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/blog', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/careers', changeFrequency: 'monthly', priority: 0.8 },
    { url: '/login', changeFrequency: 'yearly', priority: 0.5 },
    { url: '/sign-up', changeFrequency: 'yearly', priority: 0.8 },
    { url: '/forgot-password', changeFrequency: 'yearly', priority: 0.5 },
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified: currentDate,
    changeFrequency: route.changeFrequency as any,
    priority: route.priority,
  }));
}
```

---

## 13. Solution: RSC Session & Data Query Cache Deduplication

### Problem:
1. `checkUserSession` is invoked in both `layout.tsx` and `page.tsx`, initiating duplicate HTTP header parses and Better Auth database requests per page load.
2. Identical database statistics queries (`getTenderStats`) are run multiple times inside `DashboardMetrics` and `DashboardCharts` RSCs during a single render request.
3. Permission checks in `DashboardPage` are awaited sequentially, blocking streaming response times.

### Solution:
1. Wrap server-side helpers in React's request-lifecycle `cache` to deduplicate invocations.
2. Run permission queries in parallel using `Promise.all` to resolve waterfalls.

#### Caching Session Check (`apps/tracker/src/lib/session-check.ts`):
```typescript
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { cache } from 'react';

// Wrap the database / API session check in React cache
export const checkUserSession = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return { hasSession: false, hasOrganization: false };
    }

    const hasOrganization = !!session.session.activeOrganizationId;

    return {
      hasSession: true,
      hasOrganization,
      activeOrganizationId: session.session.activeOrganizationId,
    };
  } catch (error) {
    console.error('Session check error:', error);
    return { hasSession: false, hasOrganization: false };
  }
});
```

#### Parallelizing Permission Checks (`apps/tracker/src/app/(dashboard)/dashboard/page.tsx`):
```typescript
// Before (Sequential Blocking):
// const isPOAllowed = (await auth.api.hasPermission({ ... })).success;
// const isProjectAllowed = (await auth.api.hasPermission({ ... })).success;

// After (Parallel Non-Blocking):
const [poPermissionResult, projectPermissionResult] = await Promise.all([
  auth.api.hasPermission({
    headers: headersList,
    body: { permissions: { purchase_order: ['create'] } },
  }),
  auth.api.hasPermission({
    headers: headersList,
    body: { permissions: { project: ['create'] } },
  }),
]);

const hasPOPermission = poPermissionResult.success;
const hasProjectPermission = projectPermissionResult.success;
```

#### Deduplicating Database Stats Queries (`apps/tracker/src/server/tenders.ts`):
Create cached variants of server functions for use in Server Component renders:
```typescript
import { cache } from 'react';

// Standard query function (can still be used directly as action)
export async function getTenderStats(organizationId: string) {
  // DB query logic...
}

// Request-lifecycle memoized query for RSC page renders
export const getCachedTenderStats = cache(async (organizationId: string) => {
  return getTenderStats(organizationId);
});
```
*Note: Apply the same `cache` pattern to `getClientStats` and `getProjectStats` to eliminate redundant queries across complex dashboards.*

---

## 12. Solution: Secure Admin Creation Server Action

### Problem:
The server action `createSystemAdmin` in [actions.ts](file:///D:/websites/pmg-tracker-360/apps/admin/src/app/actions.ts) is public and accepts username, email, and password to create or promote users to the `admin` role without checking if any administrators already exist in the database or if the caller is an authenticated administrator.

### Solution:
Modify `createSystemAdmin` to perform a database check. If at least one administrator already exists in the system, enforce that the caller is logged in and belongs to the `admin` role before allowing the mutation.

#### Updated Action Implementation (`apps/admin/src/app/actions.ts`):
```typescript
import { count } from 'drizzle-orm';

export async function createSystemAdmin(name: string, email: string, password: string) {
  try {
    // 1. Check if any administrators already exist in the system
    const adminCountResult = await db
      .select({ count: count() })
      .from(user)
      .where(eq(user.role, 'admin'));

    const adminCount = adminCountResult[0]?.count ?? 0;

    if (adminCount > 0) {
      // Admin(s) exist, so the caller must be an authenticated administrator
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      
      if (!session || !session.user || (session.user as any).role !== 'admin') {
        return { 
          success: false, 
          error: 'Unauthorized: Only existing system administrators can register or promote other administrators.' 
        };
      }
    }

    // 2. Check if user already exists (case-insensitive)
    const existing = await db
      .select()
      .from(user)
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

    if (existing.length > 0) {
      const existingUser = existing[0];
      if (existingUser.role === 'admin') {
        return { success: false, error: 'This user is already a system administrator.' };
      }

      // Promote existing user to system administrator
      await db
        .update(user)
        .set({ role: 'admin' })
        .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

      revalidatePath('/users');

      return {
        success: true,
        message: `Existing user ${existingUser.email} has been successfully promoted to system administrator!`,
      };
    }

    // 3. Register via Better Auth
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: await headers(),
    });

    // 4. Promote to Admin
    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(sql`lower(${user.email})`, email.toLowerCase()));

    revalidatePath('/users');

    return { success: true, message: `System administrator ${email} successfully created!` };
  } catch (error) {
    const e = error as Error;
    return { success: false, error: e.message || 'An error occurred during account creation' };
  }
}
```

---

## 13. Solution: Admin Subdomain CSRF & Origin Verification

### Problem:
The admin console Better Auth configuration in [auth.ts](file:///D:/websites/pmg-tracker-360/apps/admin/src/lib/auth.ts) does not specify a `trustedOrigins` parameter, leaving the application vulnerable to origin validation failures or CSRF issues in cross-subdomain settings.

### Solution:
Add `trustedOrigins` to `apps/admin/src/lib/auth.ts` to whitelist localhost and production subdomain URLs.

#### Configuration Snippet (`apps/admin/src/lib/auth.ts`):
```typescript
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: [
    'http://localhost:3001',
    'http://localhost:3000',
    'https://admin.tendertrack360.co.za',
    'https://tendertrack360.co.za',
    ...(process.env.ADMIN_PUBLIC_URL ? [new URL(process.env.ADMIN_PUBLIC_URL).origin] : []),
  ],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
  },
  // Other options...
});
```

---

## 14. Solution: Request-level User Session Caching

### Problem:
The `getCurrentUser` helper in [users.ts](file:///D:/websites/pmg-tracker-360/apps/tracker/src/server/users.ts) fetches the session and queries the database user record but is not cached. As it is called in multiple layout files and page files during a single page render request, it triggers duplicate Drizzle and Better Auth queries.

### Solution:
Wrap the `getCurrentUser` function in React's request-lifecycle `cache` from the `react` package to ensure it runs only once per page render cycle.

#### Code Modification (`apps/tracker/src/server/users.ts`):
```typescript
import { cache } from 'react';

export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect('/login');
  }
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });
  if (!currentUser) {
    redirect('/login');
  }

  // Generate signed URL for avatar if it exists
  if (currentUser.image && !currentUser.image.startsWith('http')) {
    currentUser.image = await StorageService.getSignedUrl(currentUser.image);
  }

  return {
    ...session,
    currentUser,
  };
});
```

---

## 15. Solution: Database Cascade & Deletion Constraints

### Problem:
Foreign key references in [schema.ts](file:///D:/websites/pmg-tracker-360/packages/db/src/schema.ts) do not define `onDelete` behaviors for `organization.deletedBy`, `document.uploadedBy`, `project.tenderId`, and `project.clientId`, causing deletion of users, tenders, or clients to crash with constraint violations when associated data exists.

### Solution:
Define explicit `onDelete: 'set null'` or `onDelete: 'cascade'` rules in Drizzle foreign key definitions.

#### Schema Refactoring Snippet (`packages/db/src/schema.ts`):
```typescript
// 1. Organization deleted_by should set to null on user deletion:
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at').notNull(),
  metadata: text('metadata'),
  deletedAt: timestamp('deleted_at'),
  deletedBy: text('deleted_by').references(() => user.id, { onDelete: 'set null' }),
  deletionReason: text('deletion_reason'),
  permanentDeletionScheduledAt: timestamp('permanent_deletion_scheduled_at'),
});

// 2. Project relations should decouple tender and client deletions safely:
export const project = pgTable('project', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  projectNumber: text('project_number').notNull(),
  description: text('description'),
  tenderId: text('tender_id').references(() => tender.id, { onDelete: 'set null' }),
  clientId: text('client_id').references(() => client.id, { onDelete: 'set null' }),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// 3. Document uploadedBy should cascade on user delete (or be changed to nullable and set null):
// Option A: Cascade delete documents uploaded by user when user is deleted:
export const document = pgTable('document', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  size: text('size').notNull(),
  type: text('type').notNull(),
  tenderId: text('tender_id').references(() => tender.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => project.id, { onDelete: 'cascade' }),
  purchaseOrderId: text('purchase_order_id').references(() => purchaseOrder.id, { onDelete: 'cascade' }),
  extensionId: text('extension_id').references(() => tenderExtension.id, { onDelete: 'cascade' }),
  uploadedBy: text('uploaded_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

