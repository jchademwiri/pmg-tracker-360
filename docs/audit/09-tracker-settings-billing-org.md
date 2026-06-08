# Tracker App — Settings, Billing & Organization Audit

**Area:** Settings, Billing, Organization  
**Priority:** 🟢 Low  
**Est. Effort:** 1 day  
**Related Issues:** #23

---

## Settings Module

### Current State
- Profile summary with avatar, email verification badge
- Quick stats: Profile Complete, Security Score, Notifications status
- Navigation cards: Profile Settings, Organizations, Notifications

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Security score is hardcoded** — Shows 80 or 60 based only on email verification. Should consider password strength, 2FA status, etc. |
| 2 | 🟢 Low | **No password change UI** — Settings page links to profile but password change functionality is unclear. |

### Suggestions
- Implement real security score calculation (password age, 2FA, etc.)
- Add 2FA setup option in security settings
- Add session management (view/revoke active sessions)

---

## Billing Module

### Current State
- Usage stats display
- Current plan display
- Upgrade page

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Limited billing information** — The billing page is minimal. No invoice history, payment method management, or usage graphs. |

### Suggestions
- Add invoice history table
- Add usage graphs (tenders used vs limit)
- Add payment method management (if Stripe is integrated)

---

## Organization Module

### Current State
- Organization creation and selection
- Member management
- Invitation system

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟢 Low | **Organization switching UX** — The flow between organization selection and the dashboard could be smoother. |

### Suggestions
- Add organization switcher in the sidebar header
- Show current org name prominently in the UI

---

## Files to Modify

- `apps/tracker/src/app/(dashboard)/settings/page.tsx` — Security score, 2FA
- `apps/tracker/src/app/(dashboard)/billing/page.tsx` — Invoice history, usage graphs
- `apps/tracker/src/app/(dashboard)/billing/billing-client.tsx` — Billing UI
- `apps/tracker/src/app/(dashboard)/organization/` — Org switcher
