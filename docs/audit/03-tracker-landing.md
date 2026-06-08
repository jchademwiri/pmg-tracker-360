# Tracker App — Landing & Marketing Pages Audit

**Area:** Landing Page, Marketing  
**Priority:** 🟡 Medium  
**Est. Effort:** 0.5 day  
**Related Issues:** #16

---

## Landing / Marketing Pages

### Current State
- Clean hero section with gradient background
- Features section with 6 feature cards
- Benefits section, pricing section, testimonials (commented out), footer
- Proper JSON-LD structured data
- Commented-out `TrustedBy` section

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Features section uses emoji icons** — `📋🏗️⏰📊👥📈` instead of proper SVG icons. Looks unprofessional and inconsistent with the rest of the design system. |
| 2 | 🟡 Medium | **Testimonials section disabled** — Commented out in `page.tsx`. Should be implemented or removed cleanly. |
| 3 | 🟢 Low | **No CTA in features section** — Feature cards lack call-to-action buttons to drive sign-ups. |
| 4 | 🟢 Low | **Hardcoded features data** — Default features are hardcoded in the component. Should come from a data source or props. |

### Suggestions
- Replace emoji icons with Lucide icons or custom SVGs
- Implement testimonials section or remove cleanly
- Add CTA buttons to feature cards
- Externalize feature data to a constants file

---

## Files to Modify

- `apps/tracker/src/app/page.tsx` — Landing page
- `apps/tracker/src/components/home-page/FeaturesSection.tsx` — Replace emoji icons
- `apps/tracker/src/components/home-page/TestimonialsSection.tsx` — Implement or remove
