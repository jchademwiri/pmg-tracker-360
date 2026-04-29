# Tracker 360 — Development Testing Checklist

**Seed data:** Run `bun run seed` from `packages/db/` before testing.  
**App URL:** http://localhost:3000/dashboard  
**Dev user:** dev@tendertrack360.co.za (stub — no login required)

---

## 🏠 Dashboard

- [ ] Dashboard loads without errors
- [ ] Metrics cards show correct counts (tenders, win rate, active projects, upcoming deadlines)
- [ ] Upcoming deadlines widget shows TRN/2025/015 (3 days) and EKU/2025/022 (7 days)
- [ ] Quick actions links navigate correctly
- [ ] Dark/light theme toggle works
- [ ] Breadcrumbs show "Dashboard" on root

---

## 📋 Tenders

### Overview (`/dashboard/tenders`)
- [ ] Stats cards show: 11 total, active count, win rate, total value, overdue count
- [ ] Upcoming deadlines section shows 2 tenders due soon
- [ ] Recent activity section shows recent tenders
- [ ] Full tenders table loads with all 11 tenders
- [ ] Search by tender number works (try "EKU")
- [ ] Search by description works (try "street")
- [ ] Filter by status: draft, submitted, won, lost, pending
- [ ] Clicking a row navigates to tender detail

### Submitted (`/dashboard/tenders/submitted`)
- [ ] Shows only submitted/pending/won/lost tenders (not drafts)
- [ ] TSH/2025/003 and TRN/2025/008 visible

### Create (`/dashboard/tenders/create`)
- [ ] Form loads with all fields
- [ ] Client dropdown shows all 5 clients
- [ ] Tender number validation — try duplicate "EKU/2024/001" (should fail)
- [ ] Create a new tender successfully
- [ ] After create, redirects to tenders list
- [ ] New tender appears in list

### Detail (`/dashboard/tenders/[id]`)
- [ ] Tender details display correctly
- [ ] Client information shown
- [ ] Status badge correct colour
- [ ] Edit tender — change status from draft to submitted
- [ ] Delete tender (draft only) — confirm dialog appears
- [ ] Tender extensions tab shows extensions for EKU/2025/019

---

## 👥 Clients

### List (`/dashboard/clients`)
- [ ] All 5 clients visible
- [ ] Search by name works (try "Eskom")
- [ ] Search by contact name works

### Create (`/dashboard/clients/create`)
- [ ] Form loads
- [ ] Create a new client with all fields
- [ ] Email validation works (try invalid email)
- [ ] After create, client appears in list

### Detail (`/dashboard/clients/[id]`)
- [ ] Client details display
- [ ] Contact information shown
- [ ] Edit client — update phone number
- [ ] Cannot delete client with active tenders (try Ekurhuleni)

---

## 📁 Projects

### Overview (`/dashboard/projects`)
- [ ] Stats cards: 3 active, 8 active POs, total PO value, growth %
- [ ] Recent activity section loads
- [ ] Quick action buttons navigate correctly

### Active Projects (`/dashboard/projects/active`)
- [ ] Shows 3 active projects (PRJ-2024-001, 002, 003)
- [ ] Completed project (PRJ-2024-004) not shown (filtered to active)
- [ ] Search by project number works

### Create (`/dashboard/projects/create`)
- [ ] Form loads
- [ ] Client dropdown populated
- [ ] Tender dropdown shows won tenders only
- [ ] Selecting a won tender auto-fills description
- [ ] Create project successfully

### Detail (`/dashboard/projects/[id]`)
- [ ] Project details display
- [ ] Linked tender shown
- [ ] Client shown
- [ ] Purchase orders tab shows POs for this project
- [ ] Status change works (active → completed)

---

## 🛒 Purchase Orders

### List (`/dashboard/purchase-orders`)
- [ ] All 8 POs visible
- [ ] Status badges: delivered (green), sent (blue), draft (grey)
- [ ] Search by supplier name works (try "Rocla")
- [ ] Filter by status works
- [ ] Filter by project works

### Create (`/dashboard/purchase-orders/create`)
- [ ] Form loads
- [ ] Project dropdown populated
- [ ] PO number validation — try duplicate "PO-2024-0001" (should fail)
- [ ] Create PO successfully
- [ ] After create, PO appears in list

### Detail (`/dashboard/purchase-orders/[id]`)
- [ ] PO details display
- [ ] Linked project shown
- [ ] Status change: draft → sent → delivered
- [ ] Cannot change status of delivered PO
- [ ] Delivered date auto-set when status = delivered

---

## 📅 Calendar (`/dashboard/calendar`)
- [ ] Calendar loads without errors
- [ ] Tender submission dates visible as events
- [ ] PO expected delivery dates visible
- [ ] Clicking an event shows details

---

## 📊 Reports (`/dashboard/reports`)
- [ ] Reports page loads
- [ ] Tender statistics displayed
- [ ] Project statistics displayed

---

## ⚙️ Settings

### Overview (`/dashboard/settings`)
- [ ] Settings overview loads
- [ ] Navigation links to sub-pages work

### Profile (`/dashboard/settings/profile`)
- [ ] Profile information displays (Dev User)
- [ ] Security dashboard loads
- [ ] Active sessions section visible
- [ ] No "Security Recommendations" or 2FA section visible

### Notifications (`/dashboard/settings/notifications`)
- [ ] Shows "Coming Soon" message (not broken switches)

---

## 🏢 Organisation (`/dashboard/organization`)
- [ ] Organisation list shows PMG Construction
- [ ] Click org → detail page loads
- [ ] Members tab shows 4 members (owner, admin, manager, member)
- [ ] Settings tab loads
- [ ] Security tab loads

---

## 🧭 Navigation

- [ ] Sidebar: Dashboard link active on `/dashboard`
- [ ] Sidebar: Tenders group auto-opens on any `/dashboard/tenders/*` route
- [ ] Sidebar: Projects group auto-opens on any `/dashboard/projects/*` route
- [ ] Sidebar: Clicking group header toggles open/close
- [ ] Sidebar: Active sub-item highlighted correctly
- [ ] Sidebar: Settings link at bottom navigates correctly
- [ ] Mobile: Hamburger menu opens sheet with all nav items
- [ ] Mobile: Clicking a nav item closes the sheet
- [ ] Breadcrumbs: Show correct path on all pages
- [ ] Breadcrumbs: Links navigate correctly
- [ ] Theme toggle: Switches between light/dark/system
- [ ] User avatar menu: Shows Dev User initials "DU"

---

## 🔄 Data Integrity

- [ ] Cannot delete a client that has active tenders
- [ ] Cannot delete a tender that has active projects
- [ ] Cannot delete a project that has active POs
- [ ] Soft-deleted records don't appear in lists
- [ ] Pagination works on lists with many records

---

## 🐛 Edge Cases

- [ ] Empty state: Create a new org with no data — all pages show empty states gracefully
- [ ] Long text: Tender description truncates in table view
- [ ] Currency: Values display with "R" prefix and ZA locale formatting
- [ ] Dates: All dates display in `dd/mm/yyyy` South African format
- [ ] Overdue: Tenders past submission date show in overdue count

---

## 🔁 Re-seed

To reset all data and start fresh:
```bash
cd packages/db
bun run seed
```

To wipe everything and re-push schema:
```bash
bun run db:reset
bun run push
bun run seed
```
