import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mockGetSession is available inside vi.mock factory callbacks
// (vi.mock calls are hoisted to the top of the file by vitest's transformer)
const { mockGetSession, mockDb } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockDb = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  };
  return { mockGetSession, mockDb };
});

vi.mock('@/lib/auth', () => ({
  auth: {
    api: { getSession: mockGetSession },
  },
}));

vi.mock('@pmg/db', () => ({ db: mockDb }));
vi.mock('@pmg/db/schema', () => ({
  supportTickets: { status: 'status', id: 'id' },
  securityAuditLog: {},
}));
vi.mock('drizzle-orm', () => ({
  eq: vi.fn((_col: unknown, _val: unknown) => ({ col: _col, val: _val })),
}));
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue({}) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/constants', () => ({ PLATFORM_ORG_ID: 'org_platform_admin' }));

// Import AFTER mocks are registered
import { updateTicketStatus } from '../actions';

// Chainable mock factories
function setupDbSelectReturning(rows: unknown[]) {
  const whereMock = vi.fn().mockResolvedValue(rows);
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  mockDb.select.mockReturnValue({ from: fromMock });
}

function setupDbUpdateChain() {
  const whereMock = vi.fn().mockResolvedValue([]);
  const setMock = vi.fn().mockReturnValue({ where: whereMock });
  mockDb.update.mockReturnValue({ set: setMock });
}

function setupDbInsertChain() {
  const valuesMock = vi.fn().mockResolvedValue([]);
  mockDb.insert.mockReturnValue({ values: valuesMock });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateTicketStatus — authorization', () => {
  it('throws Unauthorized when session is null', async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(updateTicketStatus('ticket-1', 'in_progress')).rejects.toThrow('Unauthorized');
  });

  it('throws Unauthorized when session user role is "user"', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'user' } });
    await expect(updateTicketStatus('ticket-1', 'in_progress')).rejects.toThrow('Unauthorized');
  });

  it('throws Unauthorized when session user has no role field', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    await expect(updateTicketStatus('ticket-1', 'in_progress')).rejects.toThrow('Unauthorized');
  });

  it('throws Unauthorized when role is "moderator" (not admin)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'moderator' } });
    await expect(updateTicketStatus('ticket-1', 'in_progress')).rejects.toThrow('Unauthorized');
  });
});

describe('updateTicketStatus — ticket lookup', () => {
  it('throws "Ticket not found" when DB returns empty array', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
    setupDbSelectReturning([]);
    await expect(updateTicketStatus('nonexistent', 'in_progress')).rejects.toThrow('Ticket not found');
  });
});

describe('updateTicketStatus — status transition validation', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'admin' } });
  });

  it('throws "Invalid status transition" for backward move (closed → open)', async () => {
    setupDbSelectReturning([{ status: 'closed' }]);
    await expect(updateTicketStatus('ticket-1', 'open')).rejects.toThrow('Invalid status transition');
  });

  it('throws "Invalid status transition" for backward move (in_progress → open)', async () => {
    setupDbSelectReturning([{ status: 'in_progress' }]);
    await expect(updateTicketStatus('ticket-1', 'open')).rejects.toThrow('Invalid status transition');
  });

  it('throws "Invalid status transition" for same-status transition (open → open)', async () => {
    setupDbSelectReturning([{ status: 'open' }]);
    await expect(updateTicketStatus('ticket-1', 'open')).rejects.toThrow('Invalid status transition');
  });

  it('calls db.update for valid transition open → in_progress', async () => {
    setupDbSelectReturning([{ status: 'open' }]);
    setupDbUpdateChain();
    setupDbInsertChain();

    await updateTicketStatus('ticket-1', 'in_progress');

    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it('calls db.update for valid transition in_progress → closed', async () => {
    setupDbSelectReturning([{ status: 'in_progress' }]);
    setupDbUpdateChain();
    setupDbInsertChain();

    await updateTicketStatus('ticket-1', 'closed');

    expect(mockDb.update).toHaveBeenCalledOnce();
  });
});
