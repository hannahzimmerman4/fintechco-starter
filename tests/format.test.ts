import { describe, expect, it } from 'vitest';
import { dateGroupLabel, formatMonth, formatMonthName, formatMonthYear, isoDay } from '../src/format';

describe('dateGroupLabel', () => {
  it('names today and yesterday', () => {
    expect(dateGroupLabel('2026-11-11', '2026-11-11')).toBe('Today');
    expect(dateGroupLabel('2026-11-10', '2026-11-11')).toBe('Yesterday');
  });
  it('handles yesterday across month and year boundaries', () => {
    expect(dateGroupLabel('2026-10-31', '2026-11-01')).toBe('Yesterday');
    expect(dateGroupLabel('2025-12-31', '2026-01-01')).toBe('Yesterday');
  });
  it('uses month and day this year, and adds the year otherwise', () => {
    expect(dateGroupLabel('2026-11-09', '2026-11-11')).toBe('Nov 9');
    expect(dateGroupLabel('2025-11-09', '2026-11-11')).toBe('Nov 9, 2025');
  });
});

describe('isoDay and formatMonth', () => {
  it('formats a local date and a month', () => {
    expect(isoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatMonth('2026-08')).toBe('Aug');
  });
  it('formats a full month name with its year', () => {
    expect(formatMonthYear('2026-10')).toBe('October 2026');
    expect(formatMonthYear('2025-12')).toBe('December 2025');
    expect(formatMonthName('2026-09')).toBe('September');
  });
});
