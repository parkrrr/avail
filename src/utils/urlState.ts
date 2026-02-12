import type { CalendarDay, AvailabilityEvent, SerializedState } from '../types';

/**
 * Serializes calendar state into a URL-safe base64 string
 */
export function serializeState(
  days: CalendarDay[],
  events: AvailabilityEvent[],
  timezone: string
): string {
  const state: SerializedState = {
    days,
    events,
    tz: timezone,
  };
  
  const json = JSON.stringify(state);
  const base64 = btoa(json);
  
  return base64;
}

/**
 * Deserializes calendar state from URL hash
 * Returns null if no state found or invalid
 */
export function deserializeState(): SerializedState | null {
  try {
    const hash = window.location.hash.slice(1); // Remove '#'
    
    if (!hash) {
      return null;
    }
    
    const json = atob(hash);
    const state = JSON.parse(json) as SerializedState;
    
    // Basic validation
    if (!state.days || !state.events || !state.tz) {
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to deserialize state:', error);
    return null;
  }
}

/**
 * Checks if app is in view-only mode (has URL parameters)
 */
export function isViewOnlyMode(): boolean {
  return window.location.hash.length > 1;
}

/**
 * Updates the URL hash with current state
 */
export function updateUrlHash(
  days: CalendarDay[],
  events: AvailabilityEvent[],
  timezone: string
): void {
  const serialized = serializeState(days, events, timezone);
  window.history.replaceState(null, '', `#${serialized}`);
}

/**
 * Generates a shareable URL with current state
 */
export function generateShareUrl(
  days: CalendarDay[],
  events: AvailabilityEvent[],
  timezone: string
): string {
  const serialized = serializeState(days, events, timezone);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#${serialized}`;
}
