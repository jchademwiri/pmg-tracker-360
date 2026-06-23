# Findings Template

> **Copy this template** into each sub-prompt's output `findings.md` file.
> Replace all `[bracketed placeholders]` with actual content.
> Delete any sections that don't apply, but keep the structure consistent.

---

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | [e.g. 02-dashboard-audit.md] |
| **Date** | [YYYY-MM-DD] |
| **Auditor** | [Agent name or "AI Audit"] |
| **Scope** | [One-line scope description] |
| **Depends On** | [List of prompt numbers this depends on] |

---

## Executive Summary

[2-4 sentence overview of the most critical findings and overall assessment.]

**Overall Score: [X]/10**

| Area | Score | Trend |
|------|-------|-------|
| [Area 1] | [X]/10 | ↑ ↓ → |
| [Area 2] | [X]/10 | ↑ ↓ → |
| [Area 3] | [X]/10 | ↑ ↓ → |

---

## Current State

### What Exists Today

[Describe the current implementation — components, routes, data flow, UI patterns.]

### Architecture Notes

[Key technical details: frameworks used, state management, API patterns, component hierarchy.]

---

## Findings

### Critical Issues

> Issues that block core functionality or cause data loss.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | [Description] | [File/route] | [Business impact] | [S/M/L] |
| C2 | [Description] | [File/route] | [Business impact] | [S/M/L] |

### Major Issues

> Issues that significantly degrade UX or operational efficiency.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | [Description] | [File/route] | [Business impact] | [S/M/L] |
| M2 | [Description] | [File/route] | [Business impact] | [S/M/L] |

### Minor Issues

> Polish items, inconsistencies, and small UX improvements.

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | [Description] | [File/route] | [Business impact] | [S/M/L] |
| m2 | [Description] | [File/route] | [Business impact] | [S/M/L] |

---

## Recommendations

### Quick Wins (1-2 days)

> High impact, low effort — do these first.

1. **[Recommendation title]**
   - What: [Specific change]
   - Where: [Files to modify]
   - Expected outcome: [User/business benefit]

### Short-Term (1-2 weeks)

> Meaningful improvements that require focused effort.

1. **[Recommendation title]**
   - What: [Specific change]
   - Where: [Files to modify]
   - Expected outcome: [User/business benefit]

### Medium-Term (1-3 months)

> Larger features or architectural changes.

1. **[Recommendation title]**
   - What: [Specific change]
   - Where: [Files to modify]
   - Expected outcome: [User/business benefit]

---

## Component Inventory

[Map existing components/features to their current state and recommended state.]

| Component | Current State | Recommended State | Priority |
|-----------|--------------|-------------------|----------|
| [Component name] | [What it does now] | [What it should do] | [P0/P1/P2] |

---

## Cross-References

### Dependencies (findings this prompt consumed)

| Prompt | Key Finding Used |
|--------|------------------|
| [e.g. 01-codebase-audit] | [Brief finding summary] |

### Outputs (findings to pass forward)

| Prompt | Key Finding to Consume |
|--------|------------------------|
| [e.g. 05-workflow] | [Brief finding summary] |

---

## Implementation Notes

### Affected Files

```
[List of files that would need modification]
```

### New Files Required

```
[List of new files/components to create]
```

### Database Changes

- [ ] [Any schema or migration changes needed]

### API Changes

- [ ] [Any API endpoint changes needed]

---

## Open Questions

> Items that need stakeholder input or further investigation.

- [ ] [Question 1]
- [ ] [Question 2]

---

## Appendix

### Screenshots / Visual References

[Add any relevant screenshots, mockups, or visual references here.]

### Research Sources

- [Link or description of external research/best practices consulted]
