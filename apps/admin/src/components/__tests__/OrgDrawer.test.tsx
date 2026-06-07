import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('@/app/organizations/actions', () => ({
  getOrgDetail: vi.fn(),
}));

vi.mock('@/components/StatusBadge', () => ({
  default: vi.fn(() => null),
}));

// lucide-react icons used by the drawer
vi.mock('lucide-react', () => ({
  X: vi.fn(() => null),
  AlertCircle: vi.fn(() => null),
}));

describe('OrgDrawer', () => {
  it('can be imported without throwing', async () => {
    const module = await import('../OrgDrawer');
    expect(typeof module.default).toBe('function');
  });

  it('exports a default function (the component)', async () => {
    const module = await import('../OrgDrawer');
    expect(module.default).toBeDefined();
    expect(module.default.name).toBeTruthy();
  });
});
