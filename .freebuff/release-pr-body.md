## Release v1.4.0 — Contact Memory & Autocomplete

### What's Included

- **feat(contacts):** Add organization-scoped contact memory and autocomplete (PR #88)
  - New `client_contact` table with org/client indexes
  - Reusable `ContactAutocomplete` combobox component
  - Auto-save contacts on tender and extension create/update
  - Autocomplete suggestions in extension and tender forms

### Changes

| Category | Files Changed | Insertions | Deletions |
|----------|--------------|------------|-----------|
| Database Schema | 1 | 49 | 0 |
| Migration | 2 | 4,050 | 0 |
| Server Actions | 3 | 227 | 0 |
| UI Components | 5 | 325 | 25 |
| **Total** | **12** | **4,651** | **25** |

### Pre-Flight Verification

| Check | Status |
|-------|--------|
| Type Checking | ✅ |
| Unit Tests (163) | ✅ |
| Production Build | ✅ |

### Post-Deploy Action

Run the database migration after merge:
```bash
bun run db:migrate
```

### Commit History (dev → master)

- cf687e2 Merge pull request #88 from feat/contact-memory-autocomplete
- 2f5517d feat(contacts): add organization-scoped contact memory and autocomplete
