# Runner Prompt — Copy & Paste Into Any CLI

Use the following prompt in any AI coding CLI (Codebuff, Cursor, Claude, Copilot, etc.):

---

## Prompt

```
Read all files in docs/audit/app-improvements/prompts/. Start with 00-index.md to understand the full audit structure.

Then execute each sub-prompt (01 through 10) in dependency order:

Phase 1 (parallel): 01-codebase-audit.md and 07-premium-ui.md
Phase 2 (parallel): 02-dashboard-audit.md and 06-mobile-ux.md
Phase 3 (parallel): 03-tender-management.md, 04-project-management.md, 08-navigation.md
Phase 4 (parallel): 05-workflow.md and 09-forms-data-capture.md
Phase 5: 10-deliverables-roadmap.md (synthesize all findings)

For each sub-prompt:
1. Read the prompt file
2. Audit the relevant codebase (apps/tracker, packages/db, packages/ui)
3. Research best practices from the web for that specific area
4. Read FINDINGS-TEMPLATE.md for the standard findings format
5. Write your findings to docs/audit/app-improvements/[your-name]/[prompt-name]/findings.md using the template
   - Use the prompt filename without the number prefix as the subdirectory
   - e.g. [your-name]/codebase-audit/findings.md, [your-name]/dashboard-audit/findings.md
6. Follow the cross-references in each prompt to incorporate findings from dependent prompts

Save all results in docs/audit/app-improvements/[your-name]/ with subdirectories for each task.

After all phases complete, use the final synthesis prompt (10-deliverables-roadmap.md) to produce a final summary in docs/audit/app-improvements/[your-name]/FINAL-REPORT.md.
```

---

## Usage

1. Copy the prompt above
2. Paste it into any AI CLI
3. The AI will read the structured prompts, execute each audit task, and save results to `docs/audit/app-improvements/results/`

## Output Structure

```
docs/audit/app-improvements/results/
  codebase-audit/
    findings.md
  dashboard-audit/
    findings.md
  tender-management/
    findings.md
  project-management/
    findings.md
  workflow/
    findings.md
  mobile-ux/
    findings.md
  premium-ui/
    findings.md
  navigation/
    findings.md
  forms-data-capture/
    findings.md
  deliverables-roadmap/
    findings.md
  FINAL-REPORT.md
```
