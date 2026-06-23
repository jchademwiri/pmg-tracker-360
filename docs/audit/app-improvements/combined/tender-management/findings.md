# Combined Findings: Tender Management

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | 03-tender-management.md |
| **Models Compared** | Antigravity, codebuff, codex |
| **Date** | 2026-06-14 |
| **Confidence** | Medium |

---

## Reconciled Score

**Overall Score: 6.0/10**

| Model | Score | Variance |
|-------|-------|----------|
| Antigravity | 7.5/10 | +1.4 |
| codebuff | 5.0/10 | -1.1 |
| codex | 5.8/10 | -0.3 |
| **Average** | **6.1/10** | High |

Final reconciled score: **6.0/10, Medium confidence**. Antigravity rated current tender implementation higher; codebuff/codex focused more on missing operational workflow.

---

## Consensus Issues (High Confidence)

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| 1 | Tender-to-project availability/status mismatch blocks or hides awarded tender selection. | Antigravity, codex | Critical | `server/tenders.ts` |
| 2 | Follow-up tracking/logging is missing or insufficiently persistent/actionable. | codebuff, codex | Critical/Major | schema/server/UI |
| 3 | Result/outcome capture is status-only and lacks award/loss detail. | codebuff, codex | Critical/Major | `TenderDetails`, `updateTenderStatus` |
| 4 | Tender lifecycle stages are too broad and do not cover review/preparation/ready/submitted/awaiting result. | codebuff, codex | Major | tender schema, status UI |
| 5 | Tender detail lacks real checklist/readiness/evidence workflow. | Antigravity, codex | Major | `TenderDetails` |
| 6 | Tender form is long/complex and should become multi-step. | codebuff, codex | Major | `TenderForm` |
| 7 | Register needs stronger risk/date/briefing indicators and mobile treatment. | Antigravity, codex | Major | `TendersTable` |

---

## Unique Insights (Medium Confidence)

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | Manual validity date calculations should be automated. | Antigravity | Reduces administrative calculation errors. |
| 2 | Add bulk tender actions and export/comparison views. | codebuff | Useful for high-volume tender teams, but lower than workflow persistence. |
| 3 | Status labels mix “Awarded” and “Appointed / Awarded”. | codex | Small but important domain-language consistency issue. |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | Tender maturity | Antigravity says most complete module, 7.5. | codebuff says operational intelligence missing, 5. | codex says foundation exists but lifecycle missing, 5.8. | Treat CRUD as mature but workflow as incomplete; reconciled score 6.0. |
| 2 | Document checklist | Antigravity describes document checklist as present but passive. | codebuff/codex emphasize disabled upload/evidence gap. | codex says document manager visibly unavailable. | Validate current UI; prioritize enabling upload/evidence and tying checklist to files. |

---

### Critical Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| C1 | Awarded tender availability is broken or unreliable due status mismatch. | `server/tenders.ts` | Blocks tender-to-project handoff. | S |
| C2 | Follow-up/result capture is missing or not persistent. | Tender schema/server/UI | Awaiting-result work cannot be managed. | M |

### Major Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| M1 | Tender lifecycle stages are too broad. | tender schema/UI | Preparation and submission progress is unclear. | M |
| M2 | Tender detail lacks readiness checklist/evidence workflow. | `TenderDetails` | Compliance and submission proof are weak. | M |
| M3 | Tender form is long and not step-based. | `TenderForm` | Higher data-entry friction. | M |

### Minor Issues

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| m1 | Status wording and briefing/validity signals need standardization. | Tender UI | Scanability and terminology risk. | S |

## Combined Recommendations

### Quick Wins (Consensus)

1. **Fix awarded tender availability**
2. **Add tender register risk indicators**

### Short-Term (Consensus)

1. Implement persistent tender follow-ups.
2. Add result recording workflow.
3. Convert tender form to multi-step capture.
4. Enable document manager/checklist integration.

### Medium-Term (Consensus)

1. Build tender stage pipeline/Kanban board.
2. Add automated reminders for validity, follow-ups, briefings, and closing dates.

### Investigate Further

1. Bulk actions/export/comparison.
2. Required tender documents by tender type or organization.

---

## Open Questions

- What is the canonical tender status/stage vocabulary?
- Is “Appointed” or “Awarded” the preferred label?
- Which follow-up fields are mandatory for public-sector tender tracking?
