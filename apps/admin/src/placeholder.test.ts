import { describe, it, expect } from 'vitest';

describe('Test runner setup', () => {
  it('vitest is configured and running correctly', () => {
    expect(1 + 1).toBe(2);
  });

  it('fast-check is importable', async () => {
    const fc = await import('fast-check');
    expect(typeof fc.string).toBe('function');
    expect(typeof fc.integer).toBe('function');
  });
});
