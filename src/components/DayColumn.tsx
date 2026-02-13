import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import type { CalendarDay, AvailabilityEvent } from '../types';
import { formatDayLabel, formatMinutes, generateId } from '../utils/timeUtils';
import { AvailabilityBlock } from './AvailabilityBlock';

interface Props {
  day: CalendarDay;
  events: AvailabilityEvent[];
  editable: boolean;
  totalDays?: number;
  onAddEvent?: (event: AvailabilityEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onUpdateEvent?: (eventId: string, label: string) => void;
  onResizeEvent?: (eventId: string, startMinutes: number, endMinutes: number) => void;
  onRemoveDay?: (dayId: string) => void;
  onUpdateDate?: (dayId: string, newDate: string) => void;
}

export function DayColumn({
  day,
  events,
  editable,
  totalDays,
  onAddEvent,
  onDeleteEvent,
  onUpdateEvent,
  onResizeEvent,
  onRemoveDay,
  onUpdateDate,
}: Props) {
  const [editingDate, setEditingDate] = useState(false);
  const [showMorningHours, setShowMorningHours] = useState(false);
  const [showEveningHours, setShowEveningHours] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const dayEvents = events.filter((e) => e.dayId === day.id);

  // Core hours: 7AM-7PM (hours 7-18, inclusive)
  const CORE_START_HOUR = 7;
  const CORE_END_HOUR = 19; // 7PM is hour 19

  // In view-only mode, auto-expand if events exist in those time ranges
  useEffect(() => {
    if (!editable) {
      const hasMorningEvents = dayEvents.some(e => e.startMinutes < CORE_START_HOUR * 60);
      const hasEveningEvents = dayEvents.some(e => e.endMinutes > CORE_END_HOUR * 60);
      setShowMorningHours(hasMorningEvents);
      setShowEveningHours(hasEveningEvents);
    }
  }, [editable, dayEvents]);

  // Determine which hours to show
  const startHour = showMorningHours ? 0 : CORE_START_HOUR;
  const endHour = showEveningHours ? 24 : CORE_END_HOUR;

  // Generate time markers for visible hours
  const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);

  const getMinutesFromPosition = (clientY: number): number => {
    if (!gridRef.current) return 0;

    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top + gridRef.current.scrollTop;
    // Account for the offset when not showing morning hours
    const offsetMinutes = startHour * 60;
    const minutes = Math.max(0, Math.min(1439, Math.round(y + offsetMinutes)));

    // Snap to 15-minute intervals
    return Math.round(minutes / 15) * 15;
  };

  const handleClick = (e: MouseEvent) => {
    if (!editable || !gridRef.current || !onAddEvent) return;

    // Check if click was on an event block - if so, ignore
    const target = e.target as HTMLElement;
    if (target.closest('.availability-block')) return;

    const startMinutes = getMinutesFromPosition(e.clientY);
    const endMinutes = Math.min(1439, startMinutes + 15); // Create 15-minute event

    const newEvent: AvailabilityEvent = {
      id: generateId(),
      dayId: day.id,
      startMinutes,
      endMinutes,
    };

    onAddEvent(newEvent);
  };

  const handleDateClick = () => {
    if (editable && onUpdateDate) {
      setEditingDate(true);
    }
  };

  const handleDateChange = (e: Event) => {
    const newDate = (e.target as HTMLInputElement).value;
    if (onUpdateDate && newDate) {
      onUpdateDate(day.id, newDate);
    }
    setEditingDate(false);
  };

  const handleDateBlur = () => {
    setEditingDate(false);
  };

  return (
    <div className="day-column">
      <div className="day-header">
        {editingDate ? (
          <input
            type="date"
            value={day.date}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
            autoFocus
            className="day-date-input"
          />
        ) : (
          <div 
            className={`day-title ${editable && onUpdateDate ? 'editable' : ''}`}
            onClick={handleDateClick}
            title={editable && onUpdateDate ? 'Click to change date' : ''}
          >
            {formatDayLabel(day.date)}
          </div>
        )}
        {editable && onRemoveDay && totalDays !== 1 && (
          <button
            className="remove-day-btn"
            onClick={() => onRemoveDay(day.id)}
            aria-label="Remove day"
            title="Remove day"
          >
            ×
          </button>
        )}
      </div>
      {editable && !showMorningHours && (
        <button
          className="expand-hours-btn expand-hours-top"
          onClick={() => setShowMorningHours(true)}
          aria-label="Show morning hours (midnight-7AM)"
          title="Show morning hours (midnight-7AM)"
        >
          Show earlier hours ▲
        </button>
      )}
      {editable && showMorningHours && (
        <button
          className="collapse-hours-btn collapse-hours-top"
          onClick={() => setShowMorningHours(false)}
          aria-label="Hide morning hours (midnight-7AM)"
          title="Hide morning hours (midnight-7AM)"
        >
          Hide earlier hours ▼
        </button>
      )}
      <div
        className="time-grid"
        ref={gridRef}
        onClick={handleClick}
        style={{ cursor: editable ? 'pointer' : 'default' }}
      >
        <div className="time-markers" style={{ height: `${(endHour - startHour) * 60}px` }}>
          {hours.map((hour) => (
            <div
              key={hour}
              className="time-marker"
              style={{ top: `${(hour - startHour) * 60}px` }}
            >
              {formatMinutes(hour * 60)}
            </div>
          ))}
        </div>
        <div className="events-container" style={{ height: `${(endHour - startHour) * 60}px` }}>
          {dayEvents.map((event) => (
            <AvailabilityBlock
              key={event.id}
              event={event}
              editable={editable}
              siblingEvents={dayEvents}
              onDelete={onDeleteEvent}
              onUpdateLabel={onUpdateEvent}
              onResize={onResizeEvent}
              offsetMinutes={startHour * 60}
            />
          ))}
        </div>
      </div>
      {editable && !showEveningHours && (
        <button
          className="expand-hours-btn expand-hours-bottom"
          onClick={() => setShowEveningHours(true)}
          aria-label="Show evening hours (7PM-midnight)"
          title="Show evening hours (7PM-midnight)"
        >
          Show later hours ▼
        </button>
      )}
      {editable && showEveningHours && (
        <button
          className="collapse-hours-btn collapse-hours-bottom"
          onClick={() => setShowEveningHours(false)}
          aria-label="Hide evening hours (7PM-midnight)"
          title="Hide evening hours (7PM-midnight)"
        >
          Hide later hours ▲
        </button>
      )}
    </div>
  );
}
