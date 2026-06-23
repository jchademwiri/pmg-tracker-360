# Combined Findings: Premium UI

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 07-premium-ui.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | Medium |

---

## Reconciled Score

**Overall Score: 6.2/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 8.5/10 | +2.3 |
| codebuff | 4.0/10 | -2.2 |
| codex | 6.0/10 | -0.2 |
| **Average** | **6.2/10** | Very high |

Final reconciled score: **6.0/10, Medium confidence**. All models agree on the direction; they disagree on how premium the current baseline already is.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| C1 | Status colors/labels are hardcoded or inconsistent; a shared status system is needed. | Antigravity, codebuff, codex | Critical | tender/project/PO components |
| C2 | Current UI feels like a standard admin template, not a premium operational SaaS platform. | Antigravity, codebuff, codex | Major | global visual system |
| C3 | Typography and visual hierarchy need stronger, consistent scaling. | Antigravity, codebuff, codex | Major | global styles/pages |
| C4 | Cards/containers need a consistent elevation/density system. | Antigravity, codebuff, codex | Major | cards/dashboard/details |
| C5 | Empty/loading/error states are generic or inconsistent. | codebuff, codex | Major | registers/details |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Current OKLCH theme and admin dark theme are already strong foundations. | Antigravity | Helps avoid unnecessary theme rewrite; build on existing CSS tokens. |
| 2 | Charts use default Recharts styling. | codebuff | Useful polish after dashboard decisions are improved. |
| 3 | Missing domain workflow components are the real UI gap. | codex | Anchors premium UI work in operational components, not decoration. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Visual baseline quality | Antigravity scores 8.5 due OKLCH/admin theme. | codebuff scores 4 due generic shadcn defaults. | codex scores 6 due good primitives but weak domain components. | Treat design primitives as good, product-specific visual system incomplete. |
| 2 | Decorative effects | Antigravity/codebuff recommend gradients/glass. | codex prioritizes restrained operational density. | — | Use subtle elevation and density first; avoid decorative effects that reduce scanability. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | No shared status design system for tender/project/PO states. | status badges/maps | Users cannot reliably interpret state. | S |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | UI reads as a generic admin template rather than premium operational SaaS. | global UI | Lower perceived product quality. | M |
| M2 | Typography/card hierarchy and density need systematization. | pages/components | Weak scanability. | M |
| M3 | Missing domain workflow components. | domain components | UI cannot express operations clearly. | L |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Empty/loading/error states and micro-interactions are inconsistent. | shared UI | Polish and trust issue. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Centralize status UI maps/tokens**
2. **Define card and button hierarchy variants**

### Short-Term (Consensus)

1. Build workflow components: pipeline, progress cards, checklist, timeline, follow-up log, delivery progress.
2. Establish typography/spacing/density rules.
3. Improve empty/loading/error states.

### Medium-Term (Consensus)

1. Create a Tracker design system layer/component gallery.
2. Refine dashboard charts and micro-interactions.

### Investigate Further

1. Brand color authority and theming requirements.
2. Whether design tokens should live in `packages/ui` or Tracker-local.

---

## Open Questions

- Should the UI support fully branded organization themes?
- Is dark mode the primary operational mode or secondary?
