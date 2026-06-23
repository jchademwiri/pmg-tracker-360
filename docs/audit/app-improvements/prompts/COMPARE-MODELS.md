# Multi-Model Audit Comparison & Synthesis

Use this prompt after running the full audit (01–10) across **3 different AI models** (e.g., Codebuff, Cursor, Claude, Copilot). Each model should have saved its results in a separate directory.

---

## Prompt

```
You are a senior product analyst. Your task is to compare audit findings from 3 different AI models that each independently audited the same codebase, and produce a single combined report with higher-confidence results.

## Input

Three sets of findings exist in:
- docs/audit/app-improvements/[model-1-name]/
- docs/audit/app-improvements/[model-2-name]/
- docs/audit/app-improvements/[model-3-name]/

Each directory contains findings.md files for each of the 10 audit prompts (01–10), plus a FINAL-REPORT.md and INDEX.md.

## Task

### Step 1: Read All Findings

Read every findings.md file from all 3 models. For each prompt (01–10), you will have 3 versions of the findings.

### Step 2: Cross-Model Comparison

For each audit area (01–10), compare the 3 findings files and identify:

**Consensus Issues** (flagged by 2–3 models):
- These are HIGH CONFIDENCE issues
- Note which models flagged them and any differences in severity/location

**Unique Insights** (flagged by only 1 model):
- These are MEDIUM CONFIDENCE issues
- Note which model found them and why the others may have missed them

**Disagreements** (models disagree on severity or existence):
- These need investigation
- Document each model's position and recommend a resolution

### Step 3: Score Reconciliation

For each area, compare the scores from all 3 models:
- Calculate average score across models
- Note score variance (high variance = uncertain assessment)
- Produce a final reconciled score with confidence level

### Step 4: Priority Reconciliation

Compare the prioritised recommendations from all 3 models:
- Items ranked highly by ALL 3 models → Highest priority
- Items ranked highly by 2 models → High priority
- Items ranked highly by 1 model → Medium priority (review needed)
- Items unique to 1 model → Low priority (investigate)

### Step 5: Write Combined Findings

Write a combined findings.md for each audit area using this format:

---

# Combined Findings: [Area Name]

## Metadata

| Field | Value |
|-------|-------|
| **Prompt** | [e.g. 02-dashboard-audit.md] |
| **Models Compared** | [model-1], [model-2], [model-3] |
| **Date** | [YYYY-MM-DD] |
| **Confidence** | High / Medium / Low |

---

## Reconciled Score

| Model | Score | Variance |
|-------|-------|----------|
| [model-1] | X/10 | — |
| [model-2] | X/10 | ±Y |
| [model-3] | X/10 | ±Y |
| **Average** | **X/10** | |

---

## Consensus Issues (High Confidence)

> Flagged by 2–3 models. Treat as confirmed.

| # | Issue | Models | Severity | Location |
|---|-------|--------|----------|----------|
| 1 | [Issue description] | All 3 | Critical | [Location] |
| 2 | [Issue description] | 2 of 3 | Major | [Location] |

---

## Unique Insights (Medium Confidence)

> Flagged by 1 model only. Investigate before acting.

| # | Issue | Source Model | Potential Value |
|---|-------|-------------|-----------------|
| 1 | [Issue description] | [model-name] | [Why it might be important] |

---

## Disagreements (Needs Investigation)

| # | Topic | Model A says | Model B says | Model C says | Recommendation |
|---|-------|-------------|-------------|-------------|----------------|
| 1 | [Topic] | [Position] | [Position] | [Position] | [Resolution] |

---

## Combined Recommendations

### Quick Wins (Consensus)
[Only items all 3 models agree are quick wins]

### Short-Term (Consensus)
[Items 2+ models agree are short-term]

### Medium-Term (Consensus)
[Items 2+ models agree are medium-term]

### Investigate Further
[Items from single model that need validation]

---

## Open Questions
[Questions that emerged from cross-model comparison]

---

### Step 6: Write Combined Final Report

After completing all 10 area comparisons, write a combined FINAL-REPORT.md in docs/audit/app-improvements/combined/ with:

1. **Executive Summary** — Overall score, confidence level, key consensus
2. **Cross-Model Agreement Matrix** — Which issues all models agree on
3. **Combined Top 10 Priorities** — Ranked by cross-model consensus
4. **Combined Implementation Roadmap** — 7 phases with consensus-backed tasks
5. **Model Strengths** — What each model was best at finding
6. **Recommended Next Steps** — What to implement first based on highest confidence

### Step 7: Run Index Generator

Run: bun run docs/audit/app-improvements/scripts/generate-index.ts docs/audit/app-improvements/combined

---

## Output Structure

```
docs/audit/app-improvements/combined/
├── codebase-audit/findings.md
├── dashboard-audit/findings.md
├── tender-management/findings.md
├── project-management/findings.md
├── workflow/findings.md
├── mobile-ux/findings.md
├── premium-ui/findings.md
├── navigation/findings.md
├── forms-data-capture/findings.md
├── deliverables-roadmap/findings.md
├── FINAL-REPORT.md
└── INDEX.md
```
```

---

## Usage

1. Run the full audit (01–10) with 3 different AI models
2. Save each model's results in `docs/audit/app-improvements/[model-name]/`
3. Copy the prompt above into any AI CLI
4. The AI will read all 3 sets of findings, compare them, and produce a combined report

## Expected Output

- **10 combined findings files** — one per audit area with consensus scores
- **1 combined FINAL-REPORT.md** — synthesised priorities backed by cross-model agreement
- **1 INDEX.md** — auto-generated summary with confidence levels

## Example Model Directories

```
docs/audit/app-improvements/
├── codebuff/          ← Codebuff results
│   ├── codebase-audit/findings.md
│   ├── dashboard-audit/findings.md
│   └── ...
├── cursor/            ← Cursor results
│   ├── codebase-audit/findings.md
│   ├── dashboard-audit/findings.md
│   └── ...
├── claude/            ← Claude results
│   ├── codebase-audit/findings.md
│   ├── dashboard-audit/findings.md
│   └── ...
└── combined/          ← Synthesised results (generated)
```
