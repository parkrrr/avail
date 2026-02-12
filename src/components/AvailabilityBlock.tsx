import { h } from 'preact';
import { useState } from 'preact/hooks';
import type { AvailabilityEvent } from '../types';
import { formatMinutes } from '../utils/timeUtils';

interface Props {
  event: AvailabilityEvent;
  editable: boolean;
  onDelete?: (eventId: string) => void;
  onUpdateLabel?: (eventId: string, label: string) => void;
}

export function AvailabilityBlock({ event, editable, onDelete, onUpdateLabel }: Props) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(event.label || '');

  const top = event.startMinutes; // 1px per minute
  const height = event.endMinutes - event.startMinutes;
  const timeRange = `${formatMinutes(event.startMinutes)} - ${formatMinutes(event.endMinutes)}`;

  const handleLabelClick = (e: MouseEvent) => {
    if (editable) {
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

  return (
    <div
      className={`availability-block ${editable ? 'editable' : ''}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '24px',
      }}
      onClick={handleLabelClick}
    >
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
    </div>
  );
}
