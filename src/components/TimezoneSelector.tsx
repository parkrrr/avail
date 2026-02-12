import { h } from 'preact';
import { COMMON_TIMEZONES, formatTimezoneDisplay, getBrowserTimezone } from '../utils/timeUtils';

interface Props {
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

export function TimezoneSelector({ value, onChange, disabled }: Props) {
  // Check if current value is in common timezones
  const isCommonTimezone = COMMON_TIMEZONES.some(tz => tz.iana === value);
  
  return (
    <div className="timezone-selector">
      <label htmlFor="timezone-select" style={{ marginRight: '0.5rem', fontSize: '0.875rem' }}>
        Timezone:
      </label>
      <select
        id="timezone-select"
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        disabled={disabled}
      >
        {!isCommonTimezone && value && (
          <option key={value} value={value}>
            {formatTimezoneDisplay(value)}
          </option>
        )}
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz.iana} value={tz.iana}>
            {formatTimezoneDisplay(tz.iana)}
          </option>
        ))}
      </select>
    </div>
  );
}
