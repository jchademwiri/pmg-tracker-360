# Combined Findings: Deliverables Roadmap

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 10-deliverables-roadmap.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | Medium |

---

## Reconciled Score

**Overall Score: 5.7/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 9.0/10 | +2.6 |
| codebuff | 4.5/10 | -1.9 |
| codex | 5.7/10 | -0.7 |
| **Average** | **6.4/10** | Very high |

Final reconciled score: **5.7/10, Medium confidence**. Antigravity appears to score roadmap quality rather than current app readiness; the reconciled score follows the underlying audit consensus.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| C1 | PO line items, delivery notes, and partial delivery are top roadmap priorities. | Antigravity, codebuff, codex | Critical | PO module |
| C2 | Tender follow-up/result/workflow evidence is a top roadmap priority. | codebuff, codex | Critical | Tender module |
| C3 | Navigation and dashboard action queues should be early-phase work. | Antigravity, codex | Major | app shell/dashboard |
| C4 | Mobile card views and mobile form patterns are required. | codebuff, codex | Major | registers/forms |
| C5 | Design system/status badge foundation is needed. | codebuff, codex | Major | shared UI |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Member role over-restriction belongs in roadmap. | Antigravity | Important if delivery users are `member` role. |
| 2 | Follow-up tracking persistence should be the top priority. | codebuff | Very high value, but should be implemented with tender stage/result model. |
| 3 | Project detail workspace should be a distinct roadmap phase. | codex | Helps sequence project/PO work coherently. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Final score meaning | Antigravity 9/10 for synthesis/readiness. | codebuff 4.5/10 current app readiness. | codex 5.7/10 readiness. | Use current-product readiness: 5.7. |
| 2 | First implementation focus | Antigravity starts navigation/dashboard. | codebuff starts follow-ups/documents/mobile/status. | codex starts quick bug/status/mobile then dashboard/nav. | Phase 0 quick fixes, Phase 1 navigation/dashboard, Phase 2 tender evidence/follow-up. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | PO line items and partial delivery must be roadmap priorities. | PO module | Core delivery tracking absent. | L |
| C2 | Tender follow-up/result/workflow evidence must be roadmap priorities. | Tender module | Core tender administration incomplete. | L |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Dashboard/navigation action queues should be early phases. | app shell/dashboard | Improves daily usability quickly. | M |
| M2 | Mobile cards/forms and design-system foundation are required. | shared UI/mobile | Needed for premium, usable rollout. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Role permissions and organization-specific workflow choices need validation. | auth/workflow | Reduces implementation risk. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Fix `won` vs `awarded`**
2. **Build shared `StatusBadge`/status maps**
3. **Add tender mobile cards**
4. **Re-enable document upload/evidence**

### Short-Term (Consensus)

1. Dashboard action queues and nav badge counts.
2. Tender follow-up/result persistence.
3. Project detail PO summary/workspace.
4. PO status expansion and line-item grid.

### Medium-Term (Consensus)

1. Partial delivery tracking with delivery notes and outstanding quantities.
2. Activity log and notifications.
3. Mobile delivery capture and form steppers.

### Investigate Further

1. Role permissions for PO receiving.
2. Organization-specific workflow customization.

---

## Open Questions

- Should roadmap be shipped as many narrow increments or larger module rewrites?
- Which issue blocks revenue/customer adoption most: tender workflow or PO delivery?
