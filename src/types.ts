export interface AvailabilityEvent {
  id: string;
  dayId: string;
  startMinutes: number; // Minutes since midnight (0-1439)
  endMinutes: number;   // Minutes since midnight (0-1439)
  label?: string;        // Optional label like "Preferred", "Backup", etc.
}

export interface CalendarDay {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface AppState {
  days: CalendarDay[];
  events: AvailabilityEvent[];
  sourceTimezone: string; // IANA timezone (e.g., "America/New_York")
  theme: Theme;
}

export type Theme = 'light' | 'dark' | 'oled';

export interface SerializedState {
  days: CalendarDay[];
  events: AvailabilityEvent[];
  tz: string; // Timezone abbreviation for URL compactness
}
