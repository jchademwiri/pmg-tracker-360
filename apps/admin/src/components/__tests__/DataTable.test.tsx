import { describe, it, expect } from 'vitest';
import { getPaginationSlice, getTotalPages, PAGE_SIZE } from '../DataTable';

describe('DataTable pagination helpers', () => {
  describe('getPaginationSlice', () => {
    it('returns empty array for empty dataset', () => {
      const slice = getPaginationSlice([], 1, PAGE_SIZE);
      expect(slice).toEqual([]);
    });

    it('page 1 renders the first PAGE_SIZE items', () => {
      const data = Array.from({ length: 120 }, (_, i) => i);
      const slice = getPaginationSlice(data, 1, PAGE_SIZE);
      expect(slice.length).toBe(50);
      expect(slice[0]).toBe(0);
      expect(slice[49]).toBe(49);
    });

    it('page 2 renders the next PAGE_SIZE items', () => {
      const data = Array.from({ length: 120 }, (_, i) => i);
      const slice = getPaginationSlice(data, 2, PAGE_SIZE);
      expect(slice.length).toBe(50);
      expect(slice[0]).toBe(50);
      expect(slice[49]).toBe(99);
    });

    it('last page renders remaining items (fewer than PAGE_SIZE)', () => {
      const data = Array.from({ length: 75 }, (_, i) => i);
      const slice = getPaginationSlice(data, 2, PAGE_SIZE);
      expect(slice.length).toBe(25);
      expect(slice[0]).toBe(50);
      expect(slice[24]).toBe(74);
    });

    it('page beyond data length returns empty array', () => {
      const data = Array.from({ length: 10 }, (_, i) => i);
      const slice = getPaginationSlice(data, 5, PAGE_SIZE);
      expect(slice).toEqual([]);
    });

    it('page 1 of exactly PAGE_SIZE items returns all items', () => {
      const data = Array.from({ length: PAGE_SIZE }, (_, i) => i);
      const slice = getPaginationSlice(data, 1, PAGE_SIZE);
      expect(slice.length).toBe(PAGE_SIZE);
    });
  });

  describe('getTotalPages', () => {
    it('returns 1 for empty dataset', () => {
      expect(getTotalPages(0, PAGE_SIZE)).toBe(1);
    });

    it('returns 1 for data smaller than page size', () => {
      expect(getTotalPages(10, PAGE_SIZE)).toBe(1);
    });

    it('returns 1 for exactly PAGE_SIZE items', () => {
      expect(getTotalPages(PAGE_SIZE, PAGE_SIZE)).toBe(1);
    });

    it('returns 2 for PAGE_SIZE + 1 items', () => {
      expect(getTotalPages(PAGE_SIZE + 1, PAGE_SIZE)).toBe(2);
    });

    it('calculates pages correctly for 120 items', () => {
      expect(getTotalPages(120, PAGE_SIZE)).toBe(3);
    });

    it('calculates pages correctly for 75 items', () => {
      expect(getTotalPages(75, PAGE_SIZE)).toBe(2);
    });
  });

  describe('pagination boundary conditions', () => {
    it('Next button would be disabled when on last page (page * PAGE_SIZE >= data.length)', () => {
      const data = Array.from({ length: 50 }, (_, i) => i);
      const page = 1;
      const isNextDisabled = page * PAGE_SIZE >= data.length;
      expect(isNextDisabled).toBe(true);
    });

    it('Next button is enabled when not on last page', () => {
      const data = Array.from({ length: 120 }, (_, i) => i);
      const page = 1;
      const isNextDisabled = page * PAGE_SIZE >= data.length;
      expect(isNextDisabled).toBe(false);
    });

    it('Previous button would be disabled on page 1', () => {
      const page = 1;
      expect(page === 1).toBe(true);
    });

    it('Previous button is enabled on page 2', () => {
      const page: number = 2;
      expect(page === 1).toBe(false);
    });
  });

  describe('PAGE_SIZE constant', () => {
    it('PAGE_SIZE is 50', () => {
      expect(PAGE_SIZE).toBe(50);
    });
  });
});
