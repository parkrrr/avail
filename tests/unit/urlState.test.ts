import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { serializeState, deserializeState, generateShareUrl, isViewOnlyMode, updateUrlHash } from '../../src/utils/urlState';
import { CalendarDay, AvailabilityEvent } from '../../src/types';

describe('URL State Serialization', () => {
  const mockDays: CalendarDay[] = [
    { id: 'day1', date: '2026-02-11' },
    { id: 'day2', date: '2026-02-12' }
  ];
  
  const mockEvents: AvailabilityEvent[] = [
    { id: 'evt1', dayId: 'day1', startMinutes: 540, endMinutes: 600, label: 'Meeting' },
    { id: 'evt2', dayId: 'day2', startMinutes: 420, endMinutes: 480 }
  ];
  
  const timezone = 'America/New_York';

  it('should serialize state to base64 string', () => {
    const serialized = serializeState(mockDays, mockEvents, timezone);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);
    // Should be decodable as base64
    expect(() => Buffer.from(serialized, 'base64').toString()).not.toThrow();
  });

  it('should generate valid share URL', () => {
    const url = generateShareUrl(mockDays, mockEvents, timezone);
    expect(typeof url).toBe('string');
    expect(url).toContain('#');
  });

  it('should handle empty arrays in serialization', () => {
    const serialized = serializeState([], [], timezone);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);
  });

  it('should preserve event labels during serialization', () => {
    const serialized = serializeState(mockDays, mockEvents, timezone);
    // Deserialize to verify label is preserved
    const decoded = JSON.parse(Buffer.from(serialized, 'base64').toString('utf8'));
    
    const eventWithLabel = decoded.events.find((e: AvailabilityEvent) => e.label);
    expect(eventWithLabel.label).toBe('Meeting');
  });

  it('should preserve timezone information', () => {
    const serialized = serializeState(mockDays, mockEvents, timezone);
    const decoded = JSON.parse(Buffer.from(serialized, 'base64').toString('utf8'));
    
    expect(decoded.tz).toBe('America/New_York');
  });

  it('should handle invalid base64 gracefully in deserializeState when called from hash', () => {
    // Setup hash with invalid base64
    window.location.hash = 'invalid!!!base64';
    
    // Suppress console.error output during this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const result = deserializeState();
    
    // Verify error was caught and logged
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result).toBeNull();
    
    consoleErrorSpy.mockRestore();
  });

  it('should return null when hash is empty', () => {
    window.location.hash = '';
    const result = deserializeState();
    expect(result).toBeNull();
  });
});

describe('View-Only Mode Detection', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('should detect when URL contains shared state', () => {
    const days: CalendarDay[] = [{ id: 'day1', date: '2026-02-11' }];
    const events: AvailabilityEvent[] = [];
    const timezone = 'UTC';
    
    const serialized = serializeState(days, events, timezone);
    window.location.hash = serialized;
    
    const isViewOnly = isViewOnlyMode();
    expect(isViewOnly).toBe(true);
  });

  it('should return false when URL hash is empty', () => {
    window.location.hash = '';
    const isViewOnly = isViewOnlyMode();
    expect(isViewOnly).toBe(false);
  });
});

describe('URL Hash Update', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it('should update URL hash with current state', () => {
    const days: CalendarDay[] = [{ id: 'day1', date: '2026-02-11' }];
    const events: AvailabilityEvent[] = [];
    
    updateUrlHash(days, events, 'UTC');
    
    expect(window.location.hash.length).toBeGreaterThan(1);
    expect(window.location.hash.startsWith('#')).toBe(true);
  });

  it('should encode state correctly in hash', () => {
    const days: CalendarDay[] = [{ id: 'day1', date: '2026-02-11' }];
    const events: AvailabilityEvent[] = [
      { id: 'evt1', dayId: 'day1', startMinutes: 540, endMinutes: 600 }
    ];
    
    updateUrlHash(days, events, 'America/Los_Angeles');
    
    const hash = window.location.hash.slice(1);
    const decoded = JSON.parse(Buffer.from(hash, 'base64').toString('utf8'));
    
    expect(decoded.days).toHaveLength(1);
    expect(decoded.events).toHaveLength(1);
    expect(decoded.tz).toBe('America/Los_Angeles');
  });
});
