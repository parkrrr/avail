import { describe, it, expect } from 'vitest';
import { formatMinutes, formatDayLabel, getTimezoneOffset, formatTimezoneDisplay, generateId } from '../../src/utils/timeUtils';

describe('Time Formatting', () => {
  it('should format midnight as 12:00 AM', () => {
    expect(formatMinutes(0)).toBe('12:00 AM');
  });

  it('should format noon as 12:00 PM', () => {
    expect(formatMinutes(720)).toBe('12:00 PM');
  });

  it('should format morning times correctly', () => {
    expect(formatMinutes(540)).toBe('9:00 AM'); // 9 * 60
    expect(formatMinutes(600)).toBe('10:00 AM'); // 10 * 60
  });

  it('should format afternoon times correctly', () => {
    expect(formatMinutes(900)).toBe('3:00 PM'); // 15 * 60
    expect(formatMinutes(1020)).toBe('5:00 PM'); // 17 * 60
  });

  it('should format times with minutes correctly', () => {
    expect(formatMinutes(545)).toBe('9:05 AM');
    expect(formatMinutes(630)).toBe('10:30 AM');
    expect(formatMinutes(735)).toBe('12:15 PM');
  });

  it('should handle end of day times', () => {
    expect(formatMinutes(1380)).toBe('11:00 PM'); // 23 * 60
    expect(formatMinutes(1439)).toBe('11:59 PM'); // 23:59
  });
});

describe('Day Label Formatting', () => {
  it('should format date as "Day, Month Date" format', () => {
    const label = formatDayLabel('2026-02-11');
    expect(label).toMatch(/\w{3}, \w{3} \d{1,2}/); // "Wed, Feb 11" format
  });

  it('should handle different days of week', () => {
    // Monday
    const monday = formatDayLabel('2026-02-09');
    expect(monday).toContain('Mon');
    
    // Friday
    const friday = formatDayLabel('2026-02-13');
    expect(friday).toContain('Fri');
  });

  it('should display correct month and date', () => {
    const label = formatDayLabel('2026-02-11');
    expect(label).toContain('Feb');
    expect(label).toContain('11');
  });
});

describe('Timezone Display', () => {
  it('should calculate positive UTC offset for Eastern Time', () => {
    const offset = getTimezoneOffset('America/New_York');
    // Should be UTC-5 or UTC-4 depending on DST
    expect(offset).toMatch(/^UTC[+-]\d+/);
  });

  it('should format timezone display with city name', () => {
    const display = formatTimezoneDisplay('America/New_York');
    expect(display).toMatch(/UTC[+-]\d+/);
    expect(display).toMatch(/\(.*\)/); // City name in parentheses
  });

  it('should handle UTC timezone', () => {
    const display = formatTimezoneDisplay('UTC');
    expect(display).toContain('UTC');
  });

  it('should handle Pacific Time', () => {
    const offset = getTimezoneOffset('America/Los_Angeles');
    expect(offset).toMatch(/^UTC[+-]\d+/);
  });

  it('should handle Tokyo timezone', () => {
    const display = formatTimezoneDisplay('Asia/Tokyo');
    expect(display).toContain('UTC+9');
  });

  it('should handle timezones with half-hour offsets', () => {
    const display = formatTimezoneDisplay('Asia/Kolkata');
    expect(display).toMatch(/UTC\+5:30|UTC\+4:30/); // Depends on offset
  });
});

describe('ID Generation', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate IDs with timestamp and random part', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/); // Format: timestamp-random
    expect(id).toContain('-');
  });

  it('should generate IDs of similar length', () => {
    const ids = Array.from({ length: 10 }, () => generateId());
    const lengths = ids.map(id => id.length);
    // Should be reasonably similar (timestamp is stable, only random part varies slightly)
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(3);
  });

  it('should generate different IDs with small delays', async () => {
    const id1 = generateId();
    await new Promise(resolve => setTimeout(resolve, 2));
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
});
