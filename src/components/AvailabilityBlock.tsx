import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import type { AvailabilityEvent } from '../types';
import { formatMinutes } from '../utils/timeUtils';

interface Props {
  event: AvailabilityEvent;
  editable: boolean;
  onDelete?: (eventId: string) => void;
  onUpdateLabel?: (eventId: string, label: string) => void;
  onResize?: (eventId: string, startMinutes: number, endMinutes: number) => void;
}

export function AvailabilityBlock({ event, editable, onDelete, onUpdateLabel, onResize }: Props) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(event.label || '');
  const [resizing, setResizing] = useState<'top' | 'bottom' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ y: number; startMinutes: number; endMinutes: number } | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const top = event.startMinutes; // 1px per minute
  const height = event.endMinutes - event.startMinutes;
  const timeRange = `${formatMinutes(event.startMinutes)} - ${formatMinutes(event.endMinutes)}`;

  const handleLabelClick = (e: MouseEvent) => {
    if (editable && !resizing) {
      e.stopPropagation();
      setIsEditingLabel(true);
    }
  };

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (onUpdateLabel && labelValue !== event.label) {
      onUpdateLabel(event.id, labelValue);
    }
  };

  const handleLabelKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(event.id);
    }
  };

  const handleResizeStart = (e: PointerEvent, handle: 'top' | 'bottom') => {
    if (!editable || !onResize) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setResizing(handle);
    setResizeStart({
      y: e.clientY,
      startMinutes: event.startMinutes,
      endMinutes: event.endMinutes,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: PointerEvent) => {
    if (!resizing || !resizeStart || !onResize) return;

    e.preventDefault();
    
    const delta = e.clientY - resizeStart.y;
    const deltaMinutes = Math.round(delta / 15) * 15; // Snap to 15-minute intervals

    let newStartMinutes = resizeStart.startMinutes;
    let newEndMinutes = resizeStart.endMinutes;

    if (resizing === 'top') {
      newStartMinutes = Math.max(0, Math.min(resizeStart.endMinutes - 15, resizeStart.startMinutes + deltaMinutes));
    } else {
      newEndMinutes = Math.min(1439, Math.max(resizeStart.startMinutes + 15, resizeStart.endMinutes + deltaMinutes));
    }

    // Update the event
    onResize(event.id, newStartMinutes, newEndMinutes);
  };

  const handleResizeEnd = () => {
    setResizing(null);
    setResizeStart(null);
  };

  // Add global listeners for resize
  useEffect(() => {
    if (!resizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      handleResizeMove(e);
    };

    const handlePointerUp = () => {
      handleResizeEnd();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [resizing, resizeStart, onResize, event.id]);

  return (
    <div
      ref={blockRef}
      className={`availability-block ${editable ? 'editable' : ''}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '24px',
      }}
      onClick={handleLabelClick}
    >
      {editable && onResize && (
        <div
          className="resize-handle resize-handle-top"
          onPointerDown={(e) => handleResizeStart(e, 'top')}
          style={{ touchAction: 'none' }}
        />
      )}
      <div className="block-time">{timeRange}</div>
      {isEditingLabel ? (
        <input
          type="text"
          value={labelValue}
          onChange={(e) => setLabelValue((e.target as HTMLInputElement).value)}
          onBlur={handleLabelBlur}
          onKeyDown={handleLabelKeyDown}
          autoFocus
          placeholder="Add label..."
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'inherit',
            fontSize: '0.7rem',
            padding: '2px 4px',
            borderRadius: '2px',
            width: '100%',
          }}
        />
      ) : (
        event.label && <div className="block-label">{event.label}</div>
      )}
      {editable && (
        <button
          className="block-delete"
          onClick={handleDelete}
          aria-label="Delete event"
        >
          ×
        </button>
      )}
      {editable && onResize && (
        <div
          className="resize-handle resize-handle-bottom"
          onPointerDown={(e) => handleResizeStart(e, 'bottom')}
          style={{ touchAction: 'none' }}
        />
      )}
    </div>
  );
}
