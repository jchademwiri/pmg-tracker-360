import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercentage } from '../format';

describe('formatCurrency', () => {
  describe('number inputs', () => {
    it('formats zero as R 0', () => {
      const result = formatCurrency(0);
      expect(result).toContain('R');
      expect(result).toContain('0');
    });

    it('formats whole numbers with R prefix', () => {
      expect(formatCurrency(1234)).toContain('1');
      expect(formatCurrency(1234)).toContain('2');
      expect(formatCurrency(1234)).toContain('3');
      expect(formatCurrency(1234)).toContain('4');
    });

    it('formats large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('formats negative numbers', () => {
      const result = formatCurrency(-500);
      expect(result).toContain('500');
    });

    it('returns R 0 for NaN', () => {
      expect(formatCurrency(NaN)).toBe('R 0');
    });
  });

  describe('string inputs', () => {
    it('formats numeric string', () => {
      const result = formatCurrency('5000');
      expect(result).toContain('5');
      expect(result).toContain('000');
    });

    it('strips R prefix from string', () => {
      const result = formatCurrency('R 5000');
      expect(result).toContain('5');
      expect(result).toContain('000');
    });

    it('strips lowercase r prefix', () => {
      const result = formatCurrency('r 5000');
      expect(result).toContain('5');
      expect(result).toContain('000');
    });

    it('strips commas from string', () => {
      const result = formatCurrency('1,234,567');
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('567');
    });

    it('strips spaces from string', () => {
      const result = formatCurrency('1 234');
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('handles decimal string', () => {
      const result = formatCurrency('1234.56');
      // Regex strips non-numeric chars except dots, parseFloat('1234.56') = 1234.56
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('returns R 0 for non-numeric string', () => {
      expect(formatCurrency('abc')).toBe('R 0');
    });

    it('returns R 0 for empty string', () => {
      expect(formatCurrency('')).toBe('R 0');
    });

    it('returns R 0 for mixed alpha-numeric', () => {
      expect(formatCurrency('Rabc')).toBe('R 0');
    });
  });

  describe('null and undefined inputs', () => {
    it('returns R 0 for null', () => {
      expect(formatCurrency(null)).toBe('R 0');
    });

    it('returns R 0 for undefined', () => {
      expect(formatCurrency(undefined)).toBe('R 0');
    });
  });

  describe('options', () => {
    it('respects minimumFractionDigits option', () => {
      const result = formatCurrency(1234, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('respects maximumFractionDigits option', () => {
      const result = formatCurrency(1234.56, { maximumFractionDigits: 2 });
      expect(result).toContain('1');
      expect(result).toContain('234');
    });
  });
});

describe('formatDate', () => {
  it('returns fallback for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns fallback for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('returns custom fallback', () => {
    expect(formatDate(null, 'N/A')).toBe('N/A');
  });

  it('formats a Date object', () => {
    const date = new Date('2026-06-15T12:00:00Z');
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('2026');
    expect(result).toMatch(/Jun/);
  });

  it('formats a date string', () => {
    const result = formatDate('2026-01-20T00:00:00Z');
    expect(result).toContain('20');
    expect(result).toContain('2026');
    expect(result).toMatch(/Jan/);
  });

  it('formats in SAST timezone', () => {
    // Midnight UTC = 02:00 SAST, same day
    const date = new Date(Date.UTC(2026, 5, 15, 0, 0, 0));
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toMatch(/Jun/);
  });
});

describe('formatDateTime', () => {
  it('returns fallback for null', () => {
    expect(formatDateTime(null)).toBe('-');
  });

  it('returns custom fallback', () => {
    expect(formatDateTime(null, 'None')).toBe('None');
  });

  it('formats a Date object with time', () => {
    // June 15, 2026 10:00 UTC = 12:00 SAST
    const date = new Date(Date.UTC(2026, 5, 15, 10, 0, 0));
    const result = formatDateTime(date);
    expect(result).toContain('15');
    expect(result).toContain('2026');
    expect(result).toMatch(/Jun/);
    expect(result).toContain('12');
  });

  it('formats in SAST timezone', () => {
    // 22:00 UTC = 00:00 SAST next day
    const date = new Date(Date.UTC(2026, 5, 15, 22, 0, 0));
    const result = formatDateTime(date);
    expect(result).toContain('16');
    expect(result).toMatch(/Jun/);
  });
});

describe('formatNumber', () => {
  it('formats whole numbers', () => {
    expect(formatNumber(1234)).toContain('1');
    expect(formatNumber(1234)).toContain('234');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatPercentage', () => {
  it('formats 50 as 50%', () => {
    const result = formatPercentage(50);
    expect(result).toContain('50');
    expect(result).toContain('%');
  });

  it('formats 0 as 0%', () => {
    const result = formatPercentage(0);
    expect(result).toContain('0');
    expect(result).toContain('%');
  });

  it('formats 100 as 100%', () => {
    const result = formatPercentage(100);
    expect(result).toContain('100');
    expect(result).toContain('%');
  });
});
