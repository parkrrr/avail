import type { Theme } from '../types';

const THEME_STORAGE_KEY = 'avail-theme';

/**
 * Gets the initial theme preference
 */
export function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (stored && ['light', 'dark', 'oled'].includes(stored)) {
    return stored;
  }
  
  // Fall back to system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Sets the theme on the document and saves to localStorage
 */
export function setTheme(theme: Theme): void {
  document.body.className = `theme-${theme}`;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Cycles to the next theme: light → dark → oled → light
 */
export function getNextTheme(current: Theme): Theme {
  const themes: Theme[] = ['light', 'dark', 'oled'];
  const currentIndex = themes.indexOf(current);
  return themes[(currentIndex + 1) % themes.length];
}

/**
 * Gets the icon for the current theme
 */
export function getThemeIcon(theme: Theme): string {
  switch (theme) {
    case 'light':
      return '☀️';
    case 'dark':
      return '🌙';
    case 'oled':
      return '⚫';
  }
}
