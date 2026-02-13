import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import type { CalendarDay, AvailabilityEvent } from '../types';
import { formatDayLabel, formatMinutes, generateId } from '../utils/timeUtils';
import { AvailabilityBlock } from './AvailabilityBlock';

interface Props {
  day: CalendarDay;
  events: AvailabilityEvent[];
  editable: boolean;
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
  onAddEvent,
  onDeleteEvent,
  onUpdateEvent,
  onResizeEvent,
  onRemoveDay,
  onUpdateDate,
}: Props) {
  const [editingDate, setEditingDate] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const dayEvents = events.filter((e) => e.dayId === day.id);

  // Generate time markers (24 hours)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getMinutesFromPosition = (clientY: number): number => {
    if (!gridRef.current) return 0;

    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top + gridRef.current.scrollTop;
    const minutes = Math.max(0, Math.min(1439, Math.round(y)));

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
        {editable && onRemoveDay && (
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
      <div
        className="time-grid"
        ref={gridRef}
        onClick={handleClick}
        style={{ cursor: editable ? 'pointer' : 'default' }}
      >
        <div className="time-markers">
          {hours.map((hour) => (
            <div
              key={hour}
              className="time-marker"
              style={{ top: `${hour * 60}px` }}
            >
              {formatMinutes(hour * 60)}
            </div>
          ))}
        </div>
        <div className="events-container">
          {dayEvents.map((event) => (
            <AvailabilityBlock
              key={event.id}
              event={event}
              editable={editable}
              siblingEvents={dayEvents}
              onDelete={onDeleteEvent}
              onUpdateLabel={onUpdateEvent}
              onResize={onResizeEvent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
