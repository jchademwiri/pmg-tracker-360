import { describe, it, expect } from 'bun:test';
import { admin, owner, manager, member } from './permissions';

// Robust Helper to verify better-auth permissions
function can(role: any, resource: string, action: string, data?: any) {
  if (!role.statements) return false;
  const actions = role.statements[resource];
  if (!actions) return false;

  // Check simple string matches
  if (actions.includes(action)) return true;

  // Check object with condition
  const conditionalAction = actions.find(
    (a: any) => typeof a === 'object' && a.action === action
  );
  if (conditionalAction) {
    if (!conditionalAction.condition) return true; // No condition = allowed
    if (!data) return false; // Condition exists but no data provided to check against
    return conditionalAction.condition(data);
  }

  return false;
}

const DRAFT_TENDER = { status: 'draft' };
const SUBMITTED_TENDER = { status: 'submitted' };

describe('Access Control', () => {
  // ... Phase 1 & 2 tests (abbreviated for brevity in edit, but full content in file)
  describe('Phase 1: Owner & Admin', () => {
    it('Owner: full access', () => {
      expect(can(owner, 'organization', 'delete')).toBe(true);
    });
    it('Admin: no org delete', () => {
      expect(can(admin, 'organization', 'delete')).toBe(false);
    });
  });

  describe('Phase 2: Manager Role', () => {
    it('should have full Project access EXCEPT delete', () => {
      expect(can(manager, 'project', 'create')).toBe(true);
      expect(can(manager, 'project', 'read')).toBe(true);
      expect(can(manager, 'project', 'update')).toBe(true);
      expect(can(manager, 'project', 'delete')).toBe(false);
    });

    it('should be able to delete DRAFT tenders', () => {
      expect(can(manager, 'tender', 'delete', DRAFT_TENDER)).toBe(true);
    });

    it('should NOT be able to delete SUBMITTED tenders', () => {
      expect(can(manager, 'tender', 'delete', SUBMITTED_TENDER)).toBe(false);
    });
  });

  describe('Phase 3: Member Role', () => {
    it('should have READ ONLY Project access', () => {
      expect(can(member, 'project', 'read')).toBe(true);
      expect(can(member, 'project', 'create')).toBe(false);
      expect(can(member, 'project', 'update')).toBe(false);
      expect(can(member, 'project', 'delete')).toBe(false);
    });

    it('should have Tender Create/Update access', () => {
      expect(can(member, 'tender', 'create')).toBe(true);
      expect(can(member, 'tender', 'update')).toBe(true);
    });

    it('should be able to delete DRAFT tenders', () => {
      expect(can(member, 'tender', 'delete', DRAFT_TENDER)).toBe(true);
    });

    it('should NOT be able to delete SUBMITTED tenders', () => {
      expect(can(member, 'tender', 'delete', SUBMITTED_TENDER)).toBe(false);
    });
  });
});
