import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Gets the browser's default timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Finds the closest matching timezone from COMMON_TIMEZONES
 * Returns the browser timezone if it's in the list, otherwise returns the first timezone
 */
export function getDefaultTimezone(): string {
  const browserTz = getBrowserTimezone();
  
  // Check if browser timezone is in our common list
  const match = COMMON_TIMEZONES.find(tz => tz.iana === browserTz);
  if (match) {
    return match.iana;
  }
  
  // If not found, return the browser timezone anyway (it will still work)
  // but it won't have a nice display name
  return browserTz;
}

/**
 * Common timezones with their display names
 */
export const COMMON_TIMEZONES = [
  { iana: 'Pacific/Honolulu', name: 'Hawaii Time' },
  { iana: 'America/Anchorage', name: 'Alaska Time' },
  { iana: 'America/Los_Angeles', name: 'Pacific Time' },
  { iana: 'America/Denver', name: 'Mountain Time' },
  { iana: 'America/Chicago', name: 'Central Time' },
  { iana: 'America/New_York', name: 'Eastern Time' },
  { iana: 'America/Halifax', name: 'Atlantic Time' },
  { iana: 'America/St_Johns', name: 'Newfoundland Time' },
  { iana: 'America/Sao_Paulo', name: 'Brazil Time' },
  { iana: 'America/Argentina/Buenos_Aires', name: 'Argentina Time' },
  { iana: 'Atlantic/Azores', name: 'Azores' },
  { iana: 'UTC', name: 'UTC' },
  { iana: 'Europe/London', name: 'London' },
  { iana: 'Europe/Paris', name: 'Central European Time' },
  { iana: 'Europe/Berlin', name: 'Berlin' },
  { iana: 'Europe/Athens', name: 'Athens' },
  { iana: 'Africa/Cairo', name: 'Cairo' },
  { iana: 'Europe/Moscow', name: 'Moscow' },
  { iana: 'Asia/Dubai', name: 'Dubai' },
  { iana: 'Asia/Karachi', name: 'Pakistan' },
  { iana: 'Asia/Kolkata', name: 'India' },
  { iana: 'Asia/Dhaka', name: 'Bangladesh' },
  { iana: 'Asia/Bangkok', name: 'Bangkok' },
  { iana: 'Asia/Shanghai', name: 'China' },
  { iana: 'Asia/Tokyo', name: 'Tokyo' },
  { iana: 'Asia/Seoul', name: 'Seoul' },
  { iana: 'Australia/Sydney', name: 'Sydney' },
  { iana: 'Australia/Brisbane', name: 'Brisbane' },
  { iana: 'Pacific/Auckland', name: 'Auckland' },
];

/**
 * Gets the UTC offset for a timezone in +/-HH:MM format
 */
export function getTimezoneOffset(timezone: string): string {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  
  const sign = offsetMinutes >= 0 ? '+' : '-';
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formats a timezone for display in the selector
 */
export function formatTimezoneDisplay(timezone: string): string {
  const tz = COMMON_TIMEZONES.find(t => t.iana === timezone);
  const offset = getTimezoneOffset(timezone);
  const name = tz?.name || timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
  return `${offset} (${name})`;
}

/**
 * Converts minutes since midnight in source timezone to minutes in target timezone
 */
export function convertMinutesToTimezone(
  dateStr: string,
  minutes: number,
  sourceTimezone: string,
  targetTimezone: string
): number {
  // Create a date object for the given day at the specified minutes
  const date = parseISO(dateStr);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  date.setHours(hours, mins, 0, 0);
  
  // Convert from source timezone to UTC, then to target timezone
  const utcTime = fromZonedTime(date, sourceTimezone);
  const targetTime = toZonedTime(utcTime, targetTimezone);
  
  // Return minutes since midnight in target timezone
  return targetTime.getHours() * 60 + targetTime.getMinutes();
}

/**
 * Formats minutes since midnight as HH:MM AM/PM
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats a date string as a readable day label
 */
export function formatDayLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'EEE, MMM d');
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
