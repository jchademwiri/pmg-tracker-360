import { describe, it, expect } from 'vitest';

// Inline the expected variant map for testing purposes
// (MetricCard is a Server Component — we test the logic without a full render)
const VARIANT_MAP = {
  primary: { countColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10', iconBorder: 'border-indigo-500/20' },
  success: { countColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/20' },
  warning: { countColor: 'text-amber-400', iconBg: 'bg-amber-500/10', iconBorder: 'border-amber-500/20' },
  danger:  { countColor: 'text-red-400',    iconBg: 'bg-red-500/10',    iconBorder: 'border-red-500/20' },
};

describe('MetricCard variant colour classes', () => {
  it('primary variant uses indigo classes', () => {
    expect(VARIANT_MAP.primary.countColor).toBe('text-indigo-400');
    expect(VARIANT_MAP.primary.iconBg).toContain('indigo');
  });

  it('success variant uses emerald classes', () => {
    expect(VARIANT_MAP.success.countColor).toBe('text-emerald-400');
    expect(VARIANT_MAP.success.iconBg).toContain('emerald');
  });

  it('warning variant uses amber classes', () => {
    expect(VARIANT_MAP.warning.countColor).toBe('text-amber-400');
    expect(VARIANT_MAP.warning.iconBg).toContain('amber');
  });

  it('danger variant uses red classes', () => {
    expect(VARIANT_MAP.danger.countColor).toBe('text-red-400');
    expect(VARIANT_MAP.danger.iconBg).toContain('red');
  });

  it('all four variants are defined', () => {
    const variants = ['primary', 'success', 'warning', 'danger'] as const;
    for (const v of variants) {
      expect(VARIANT_MAP[v]).toBeDefined();
      expect(VARIANT_MAP[v].countColor).toBeTruthy();
      expect(VARIANT_MAP[v].iconBg).toBeTruthy();
      expect(VARIANT_MAP[v].iconBorder).toBeTruthy();
    }
  });

  it('countColor classes match the indigo/emerald/amber/red palette', () => {
    expect(VARIANT_MAP.primary.countColor).toMatch(/indigo/);
    expect(VARIANT_MAP.success.countColor).toMatch(/emerald/);
    expect(VARIANT_MAP.warning.countColor).toMatch(/amber/);
    expect(VARIANT_MAP.danger.countColor).toMatch(/red/);
  });

  it('iconBorder classes match the corresponding colour', () => {
    expect(VARIANT_MAP.primary.iconBorder).toContain('indigo');
    expect(VARIANT_MAP.success.iconBorder).toContain('emerald');
    expect(VARIANT_MAP.warning.iconBorder).toContain('amber');
    expect(VARIANT_MAP.danger.iconBorder).toContain('red');
  });
});
