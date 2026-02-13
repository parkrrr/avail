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
  const [pointerStartPos, setPointerStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragCommitted, setIsDragCommitted] = useState(false);
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

  const handlePointerDown = (e: PointerEvent) => {
    if (!editable || !gridRef.current) return;

    const minutes = getMinutesFromPosition(e.clientY);
    setDragging(true);
    setDragStart(minutes);
    setDragEnd(minutes);
    setPointerStartPos({ x: e.clientX, y: e.clientY });
    setIsDragCommitted(false);

    // Capture pointer events
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragging || dragStart === null || !pointerStartPos) return;

    const deltaX = Math.abs(e.clientX - pointerStartPos.x);
    const deltaY = Math.abs(e.clientY - pointerStartPos.y);

    // Threshold: 8px vertical movement AND vertical movement should be 1.5x horizontal
    // This helps distinguish vertical drags (event creation) from horizontal swipes (scrolling days)
    const DRAG_THRESHOLD = 8;
    const VERTICAL_RATIO = 1.5;

    if (!isDragCommitted && (deltaY > DRAG_THRESHOLD && deltaY > deltaX * VERTICAL_RATIO)) {
      // User is intentionally dragging vertically - commit to drag mode
      setIsDragCommitted(true);
    }

    if (isDragCommitted) {
      // Prevent default to stop scrolling once we've committed to dragging
      e.preventDefault();
      
      const minutes = getMinutesFromPosition(e.clientY);
      setDragEnd(minutes);
    }
  };

  const handlePointerUp = () => {
    if (!dragging || dragStart === null || dragEnd === null || !onAddEvent) {
      setDragging(false);
      setDragStart(null);
      setDragEnd(null);
      setPointerStartPos(null);
      setIsDragCommitted(false);
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
    setPointerStartPos(null);
    setIsDragCommitted(false);
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
