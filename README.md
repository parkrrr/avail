# Avail - Calendar Availability Sharing Tool

A lightweight, privacy-focused tool to share your calendar availability without requiring accounts, databases, or backend infrastructure. All data is encoded directly in the URL for maximum portability and privacy.

## Features

- ✨ **No Backend Required** - All data stored in the URL, no databases or servers
- 🌍 **Timezone Smart** - Automatically converts times to recipient's local timezone
- 🎨 **Three Themes** - Light, Dark, and OLED modes for any preference
- 📱 **Mobile Ready** - Touch-optimized interface with responsive design
- ⚡ **Lightweight** - Built with Preact (~3KB) for blazing fast performance
- 🔒 **Privacy First** - No tracking, no data collection, URLs are shareable but not stored

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:5173/
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests with interactive UI
npm run test

# Run unit tests (CI mode)
npm run test:run

# Run end-to-end tests
npm run test:e2e

# Run all tests (unit + e2e)
npm run test:all
```

## How to Use

### Creating Availability

1. **Select Your Timezone** - Use the dropdown to set your current timezone
2. **Add Days** - Click the `+` buttons on either side to add more days
3. **Create Availability Blocks** - Click on the time grid to create a 15-minute block, then drag the top/bottom handles to resize it
4. **Add Labels** (Optional) - Click on any block to add a label like "Preferred" or "Backup"
5. **Share** - Click "Share Availability" to get a URL you can copy and send

### Viewing Shared Availability

1. Open the shared URL in your browser
2. Times are automatically converted to your local timezone
3. The original timezone is displayed in the header for reference
4. View-only mode prevents accidental edits

## Keyboard & Interaction

- **Click Time Grid** - Create a 15-minute availability block at that position
- **Drag Resize Handles** - Drag the top or bottom handle of a block to resize it
- **Click Block** - Add or edit the block's label
- **Hover Block** - Click × to delete
- **Click Day Header** - Edit the date for that column
- **Show earlier/later hours** - Click the expand buttons above/below the grid to reveal hours before 7 AM or after 7 PM
- **Theme Button** (top-right) - Cycle through light → dark → OLED themes (preference saved in localStorage)

## Technical Stack

- **Preact** - 3KB React alternative for minimal bundle size
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **date-fns** - Modular date manipulation
- **date-fns-tz** - Timezone conversion utilities
- **Plain CSS** - CSS variables for theming, no framework overhead
- **Vitest** - Unit testing framework
- **Playwright** - End-to-end browser testing

## Architecture

The app uses a simple state management approach:

- **CalendarDay** - Represents a specific date (YYYY-MM-DD)
- **AvailabilityEvent** - Time blocks with start/end minutes + optional label
- **URL Serialization** - Base64-encoded JSON in the URL hash
- **Timezone Conversion** - Events stored in source timezone, converted on load
- **Theme Persistence** - Selected theme saved to localStorage and restored on next visit
- **Core Hours** - Default view shows 7 AM–7 PM; expand buttons reveal earlier/later hours as needed

## Browser Support

Modern browsers with ES2020 support:
- Chrome/Edge 80+
- Firefox 72+
- Safari 13.1+

## Privacy & Security

- ✅ All data is client-side only
- ✅ No cookies, no tracking, no analytics
- ✅ URLs contain only the data you explicitly add
- ✅ No server-side processing or storage
- ⚠️ URLs can be long with many events - consider URL shorteners if needed
- ⚠️ Anyone with the URL can view the availability

## License

MIT
