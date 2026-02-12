import { h } from 'preact';
import { format, addDays, parseISO } from 'date-fns';
import type { CalendarDay, AvailabilityEvent } from '../types';
import { generateId } from '../utils/timeUtils';
import { DayColumn } from './DayColumn';

interface Props {
  days: CalendarDay[];
  events: AvailabilityEvent[];
  editable: boolean;
  viewOnly?: boolean;
  onAddDay?: (day: CalendarDay) => void;
  onRemoveDay?: (dayId: string) => void;
  onAddEvent?: (event: AvailabilityEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
  onUpdateEvent?: (eventId: string, label: string) => void;
  onUpdateDate?: (dayId: string, newDate: string) => void;
}

export function CalendarGrid({
  days,
  events,
  editable,
  viewOnly,
  onAddDay,
  onRemoveDay,
  onAddEvent,
  onDeleteEvent,
  onUpdateEvent,
  onUpdateDate,
}: Props) {
  const handleAddDayBefore = () => {
    if (!onAddDay) return;
    
    if (days.length === 0) return;

    const firstDate = parseISO(days[0].date);
    const newDate = addDays(firstDate, -1);

    const newDay: CalendarDay = {
      id: generateId(),
      date: format(newDate, 'yyyy-MM-dd'),
    };

    onAddDay(newDay);
  };

  const handleAddDayAfter = () => {
    if (!onAddDay) return;
    
    if (days.length === 0) return;

    const lastDate = parseISO(days[days.length - 1].date);
    const newDate = addDays(lastDate, 1);

    const newDay: CalendarDay = {
      id: generateId(),
      date: format(newDate, 'yyyy-MM-dd'),
    };

    onAddDay(newDay);
  };

  return (
    <div className={`calendar-grid ${viewOnly ? 'view-only' : ''}`}>
      <div className="calendar-container">
        {viewOnly && days.length > 1 && (
          <div className="scroll-indicator scroll-indicator-left">‹</div>
        )}
        {editable && (
          <button
            type="button"
            className="add-day-btn"
            onClick={handleAddDayBefore}
            aria-label="Add day before"
            title="Add day before"
          >
            +
          </button>
        )}

        {days.map((day) => (
          <DayColumn
            key={day.id}
            day={day}
            events={events}
            editable={editable}
            onAddEvent={onAddEvent}
            onDeleteEvent={onDeleteEvent}
            onUpdateEvent={onUpdateEvent}
            onRemoveDay={onRemoveDay}
            onUpdateDate={onUpdateDate}
          />
        ))}

        {editable && (
          <button
            type="button"
            className="add-day-btn"
            onClick={handleAddDayAfter}
            aria-label="Add day after"
            title="Add day after"
          >
            +
          </button>
        )}
        
        {viewOnly && days.length > 1 && (
          <div className="scroll-indicator scroll-indicator-right">›</div>
        )}
      </div>
    </div>
  );
}
