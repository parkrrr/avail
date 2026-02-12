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
  onRemoveDay,
  onUpdateDate,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [editingDate, setEditingDate] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const isDragIntentRef = useRef(false);

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

  const handlePointerDown = (e: PointerEvent) => {
    if (!editable || !gridRef.current) return;

    const minutes = getMinutesFromPosition(e.clientY);
    
    // Store initial pointer position to detect drag intent
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    isDragIntentRef.current = false;
    
    // Store initial time position for later drag comparison
    // (needed to calculate event duration once drag intent is confirmed)
    setDragStart(minutes);
    setDragEnd(minutes);

    // Capture pointer events
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (dragStart === null || !pointerStartRef.current) return;

    // Calculate movement distance to detect drag intent
    const deltaX = Math.abs(e.clientX - pointerStartRef.current.x);
    const deltaY = Math.abs(e.clientY - pointerStartRef.current.y);
    
    // Require at least 8px vertical movement to start dragging
    // This prevents accidental event creation during scrolling
    const DRAG_THRESHOLD = 8;
    
    // Use ratio-based check: vertical movement should be at least 1.5x horizontal
    // This allows for slight horizontal variance during vertical drags
    if (!isDragIntentRef.current && deltaY > DRAG_THRESHOLD && deltaY > deltaX * 1.5) {
      // Vertical movement exceeds threshold and is significantly more than horizontal - it's a drag
      isDragIntentRef.current = true;
      setDragging(true);
    }

    if (isDragIntentRef.current) {
      const minutes = getMinutesFromPosition(e.clientY);
      setDragEnd(minutes);
    }
  };

  const handlePointerUp = () => {
    if (!isDragIntentRef.current || dragStart === null || dragEnd === null || !onAddEvent) {
      // Reset state
      setDragging(false);
      setDragStart(null);
      setDragEnd(null);
      pointerStartRef.current = null;
      isDragIntentRef.current = false;
      return;
    }

    const startMinutes = Math.min(dragStart, dragEnd);
    const endMinutes = Math.max(dragStart, dragEnd);

    // Minimum event duration: 15 minutes
    if (endMinutes - startMinutes >= 15) {
      const newEvent: AvailabilityEvent = {
        id: generateId(),
        dayId: day.id,
        startMinutes,
        endMinutes,
      };

      onAddEvent(newEvent);
    }

    setDragging(false);
    setDragStart(null);
    setDragEnd(null);
    pointerStartRef.current = null;
    isDragIntentRef.current = false;
  };

  useEffect(() => {
    if (dragging) {
      const handleGlobalPointerUp = () => handlePointerUp();
      window.addEventListener('pointerup', handleGlobalPointerUp);
      return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }
  }, [dragging, dragStart, dragEnd]);

  const renderDragPreview = () => {
    if (!dragging || dragStart === null || dragEnd === null) return null;

    const startMinutes = Math.min(dragStart, dragEnd);
    const endMinutes = Math.max(dragStart, dragEnd);
    const top = startMinutes;
    const height = endMinutes - startMinutes;

    return (
      <div
        style={{
          position: 'absolute',
          left: '4rem',
          right: '0.5rem',
          top: `${top}px`,
          height: `${height}px`,
          background: 'var(--event-bg)',
          opacity: 0.5,
          borderRadius: '0.375rem',
          pointerEvents: 'none',
        }}
      />
    );
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ cursor: editable ? 'crosshair' : 'default' }}
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
              onDelete={onDeleteEvent}
              onUpdateLabel={onUpdateEvent}
            />
          ))}
          {renderDragPreview()}
        </div>
      </div>
    </div>
  );
}
