import {
  nowInSAST,
  toSASTDateString,
  toSASTDateTimeString,
  parseDateToUTC,
  parseDateTimeToUTC,
  SAST_TIMEZONE,
  SAST_OFFSET_HOURS,
  SAST_OFFSET_MS,
} from '../timezone';

describe('timezone utilities', () => {
  describe('constants', () => {
    it('SAST_TIMEZONE is Africa/Johannesburg', () => {
      expect(SAST_TIMEZONE).toBe('Africa/Johannesburg');
    });

    it('SAST_OFFSET_HOURS is 2', () => {
      expect(SAST_OFFSET_HOURS).toBe(2);
    });

    it('SAST_OFFSET_MS is 2 hours in milliseconds', () => {
      expect(SAST_OFFSET_MS).toBe(2 * 60 * 60 * 1000);
    });
  });

  describe('nowInSAST', () => {
    it('returns a Date object', () => {
      const result = nowInSAST();
      expect(result).toBeInstanceOf(Date);
    });

    it('returns a valid date', () => {
      const result = nowInSAST();
      expect(isNaN(result.getTime())).toBe(false);
    });

    it('returns approximately the current time', () => {
      const before = Date.now();
      const result = nowInSAST();
      const after = Date.now();
      expect(result.getTime()).toBeGreaterThanOrEqual(before - 100);
      expect(result.getTime()).toBeLessThanOrEqual(after + 100);
    });
  });

  describe('toSASTDateString', () => {
    it('returns empty string for null', () => {
      expect(toSASTDateString(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(toSASTDateString(undefined)).toBe('');
    });

    it('returns empty string for empty string', () => {
      expect(toSASTDateString('')).toBe('');
    });

    it('returns YYYY-MM-DD format', () => {
      // January 15, 2026 12:00 UTC = 14:00 SAST
      const date = new Date(Date.UTC(2026, 0, 15, 12, 0, 0));
      const result = toSASTDateString(date);
      expect(result).toBe('2026-01-15');
    });

    it('formats date string input correctly', () => {
      const result = toSASTDateString('2026-06-15T12:00:00Z');
      expect(result).toBe('2026-06-15');
    });

    it('returns empty string for invalid date', () => {
      const date = new Date('invalid');
      expect(toSASTDateString(date)).toBe('');
    });

    it('handles midnight UTC correctly', () => {
      // Midnight UTC = 02:00 SAST, same calendar day
      const date = new Date(Date.UTC(2026, 5, 15, 0, 0, 0));
      const result = toSASTDateString(date);
      expect(result).toBe('2026-06-15');
    });
  });

  describe('toSASTDateTimeString', () => {
    it('returns empty string for null', () => {
      expect(toSASTDateTimeString(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(toSASTDateTimeString(undefined)).toBe('');
    });

    it('returns YYYY-MM-DD HH:mm format (sv-SE locale uses space)', () => {
      // June 15, 2026 10:00 UTC = 12:00 SAST
      const date = new Date(Date.UTC(2026, 5, 15, 10, 0, 0));
      const result = toSASTDateTimeString(date);
      expect(result).toMatch(/2026-06-15[ ]12:00/);
    });

    it('handles date string input', () => {
      // December 25, 2026 08:00 UTC = 10:00 SAST
      const result = toSASTDateTimeString('2026-12-25T08:00:00Z');
      expect(result).toBe('2026-12-25T10:00');
    });

    it('returns empty string for invalid date', () => {
      const date = new Date('invalid');
      expect(toSASTDateTimeString(date)).toBe('');
    });

    it('handles midnight UTC correctly (same day in SAST)', () => {
      // Midnight UTC = 02:00 SAST, same calendar day
      const date = new Date(Date.UTC(2026, 5, 15, 0, 0, 0));
      const result = toSASTDateTimeString(date);
      expect(result).toMatch(/2026-06-15[ ]02:00/);
    });

    it('handles 22:00 UTC correctly (next day in SAST)', () => {
      // 22:00 UTC = 00:00 SAST next day
      const date = new Date(Date.UTC(2026, 5, 15, 22, 0, 0));
      const result = toSASTDateTimeString(date);
      expect(result).toMatch(/2026-06-16[ ]00:00/);
    });
  });

  describe('parseDateToUTC', () => {
    it('returns null for null', () => {
      expect(parseDateToUTC(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(parseDateToUTC(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseDateToUTC('')).toBeNull();
    });

    it('parses YYYY-MM-DD to UTC midnight', () => {
      const result = parseDateToUTC('2026-06-15');
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe('2026-06-15T00:00:00.000Z');
    });

    it('returns null for invalid format', () => {
      expect(parseDateToUTC('not-a-date')).toBeNull();
    });

    it('returns null for partial date', () => {
      expect(parseDateToUTC('2026-06')).toBeNull();
    });

    it('handles month boundary correctly', () => {
      const result = parseDateToUTC('2026-12-31');
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe('2026-12-31T00:00:00.000Z');
    });
  });

  describe('parseDateTimeToUTC', () => {
    it('returns null for null', () => {
      expect(parseDateTimeToUTC(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(parseDateTimeToUTC(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseDateTimeToUTC('')).toBeNull();
    });

    it('converts SAST time to UTC (subtracts 2 hours)', () => {
      // 10:00 SAST = 08:00 UTC
      const result = parseDateTimeToUTC('2026-06-15T10:00');
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe('2026-06-15T08:00:00.000Z');
    });

    it('handles midnight SAST (previous day UTC)', () => {
      // 00:00 SAST = 22:00 UTC previous day
      const result = parseDateTimeToUTC('2026-06-15T00:00');
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe('2026-06-14T22:00:00.000Z');
    });

    it('handles 23:00 SAST correctly', () => {
      // 23:00 SAST = 21:00 UTC
      const result = parseDateTimeToUTC('2026-06-15T23:00');
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe('2026-06-15T21:00:00.000Z');
    });

    it('returns null for invalid format', () => {
      expect(parseDateTimeToUTC('not-a-datetime')).toBeNull();
    });

    it('returns null for date only (no time)', () => {
      expect(parseDateTimeToUTC('2026-06-15')).toBeNull();
    });

    it('handles minutes correctly', () => {
      // 14:30 SAST = 12:30 UTC
      const result = parseDateTimeToUTC('2026-06-15T14:30');
      expect(result).not.toBeNull();
      expect(result!.toISOString()).toBe('2026-06-15T12:30:00.000Z');
    });
  });
});
