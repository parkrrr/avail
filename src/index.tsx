import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { format } from 'date-fns';

import './style.css';

import type { CalendarDay, AvailabilityEvent, Theme } from './types';
import { deserializeState, generateShareUrl, isViewOnlyMode } from './utils/urlState';
import { getBrowserTimezone, generateId, convertMinutesToTimezone } from './utils/timeUtils';
import { getInitialTheme, setTheme } from './utils/theme';

import { ThemeSwitcher } from './components/ThemeSwitcher';
import { TimezoneSelector } from './components/TimezoneSelector';
import { CalendarGrid } from './components/CalendarGrid';
import { ShareModal } from './components/ShareModal';

export function App() {
	const [days, setDays] = useState<CalendarDay[]>([]);
	const [events, setEvents] = useState<AvailabilityEvent[]>([]);
	const [timezone, setTimezone] = useState<string>(getBrowserTimezone());
	const [sourceTimezone, setSourceTimezone] = useState<string>(getBrowserTimezone());
	const [theme, setThemeState] = useState<Theme>(getInitialTheme());
	const [showShareModal, setShowShareModal] = useState(false);
	const [viewOnly, setViewOnly] = useState(() => {
		// Check if URL has a valid base64-encoded hash on initial mount
		const hash = window.location.hash.slice(1);
		if (!hash) return false;
		
		try {
			// Try to decode to verify it's valid base64
			atob(hash);
			return true;
		} catch {
			return false;
		}
	});

	// Initialize app state
	useEffect(() => {
		// Apply initial theme
		setTheme(theme);

		// Check if loading from URL
		const serialized = deserializeState();
		
		if (serialized) {
			// View-only mode: load from URL
			setViewOnly(true);
			setSourceTimezone(serialized.tz);
			setDays(serialized.days);
			
			// Convert event times from source timezone to user's local timezone
			const localTimezone = getBrowserTimezone();
			const convertedEvents = serialized.events.map(event => {
				const day = serialized.days.find(d => d.id === event.dayId);
				if (!day) return event;

				const convertedStart = convertMinutesToTimezone(
					day.date,
					event.startMinutes,
					serialized.tz,
					localTimezone
				);
				const convertedEnd = convertMinutesToTimezone(
					day.date,
					event.endMinutes,
					serialized.tz,
					localTimezone
				);

				return {
					...event,
					startMinutes: convertedStart,
					endMinutes: convertedEnd,
				};
			});
			
			setEvents(convertedEvents);
			setTimezone(localTimezone);
		} else {
			// Edit mode: start with today
			const today: CalendarDay = {
				id: generateId(),
				date: format(new Date(), 'yyyy-MM-dd'),
			};
			setDays([today]);
		}
	}, []);

	const handleAddDay = (day: CalendarDay) => {
		setDays(prev => {
			// Insert in chronological order
			const newDays = [...prev, day];
			newDays.sort((a, b) => a.date.localeCompare(b.date));
			return newDays;
		});
	};

	const handleRemoveDay = (dayId: string) => {
		setDays(prev => prev.filter(d => d.id !== dayId));
		setEvents(prev => prev.filter(e => e.dayId !== dayId));
	};

	const handleUpdateDate = (dayId: string, newDate: string) => {
		setDays(prev =>
			prev.map(d => (d.id === dayId ? { ...d, date: newDate } : d))
				.sort((a, b) => a.date.localeCompare(b.date))
		);
	};

	const handleAddEvent = (event: AvailabilityEvent) => {
		setEvents(prev => [...prev, event]);
	};

	const handleDeleteEvent = (eventId: string) => {
		setEvents(prev => prev.filter(e => e.id !== eventId));
	};

	const handleUpdateEvent = (eventId: string, label: string) => {
		setEvents(prev =>
			prev.map(e => (e.id === eventId ? { ...e, label } : e))
		);
	};

	const handleTimezoneChange = (newTimezone: string) => {
		setTimezone(newTimezone);
	};

	const handleThemeChange = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	const handleShare = () => {
		setShowShareModal(true);
	};

	const shareUrl = generateShareUrl(days, events, timezone);

	return (
		<div id="app">
			<ThemeSwitcher currentTheme={theme} onThemeChange={handleThemeChange} disabled={viewOnly} />
			
			<div className="app-header">
				<TimezoneSelector
					value={timezone}
					onChange={handleTimezoneChange}
					disabled={viewOnly}
				/>
				{viewOnly && (
					<div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
						Viewing shared availability (times converted from {sourceTimezone})
					</div>
				)}
			</div>

			<CalendarGrid
				days={days}
				events={events}
				editable={!viewOnly}
			viewOnly={viewOnly}
			onAddDay={handleAddDay}
			onRemoveDay={handleRemoveDay}
			onAddEvent={handleAddEvent}
			onDeleteEvent={handleDeleteEvent}
			onUpdateEvent={handleUpdateEvent}
			onUpdateDate={handleUpdateDate}
		/>

		{!viewOnly && events.length > 0 && (
			<button className="share-button" onClick={handleShare}>
				Share Availability
			</button>
		)}

		{showShareModal && (
			<ShareModal
				url={shareUrl}
				onClose={() => setShowShareModal(false)}
			/>
		)}
	</div>
);
}

render(<App />, document.getElementById('app')!);

