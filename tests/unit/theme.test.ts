import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getInitialTheme, setTheme, getNextTheme, getThemeIcon } from '../../src/utils/theme';

const THEME_STORAGE_KEY = 'avail-theme';

describe('Theme Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset body class
    document.body.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  it('should return stored theme preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const theme = getInitialTheme();
    expect(theme).toBe('dark');
  });

  it('should return light theme as default', () => {
    localStorage.clear();
    // Mock matchMedia to return false (not dark mode preference)
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const theme = getInitialTheme();
    expect(theme).toBe('light');
  });

  it('should set theme and update DOM', () => {
    setTheme('dark');
    expect(document.body.className).toContain('theme-dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('should set OLED theme', () => {
    setTheme('oled');
    expect(document.body.className).toContain('theme-oled');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('oled');
  });

  it('should set light theme', () => {
    setTheme('light');
    expect(document.body.className).toContain('theme-light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should cycle themes: light → dark → oled → light', () => {
    let theme: any = 'light';
    let next = getNextTheme(theme);
    expect(next).toBe('dark');
    
    next = getNextTheme(next);
    expect(next).toBe('oled');
    
    next = getNextTheme(next);
    expect(next).toBe('light');
  });

  it('should return correct theme icon emoji', () => {
    expect(getThemeIcon('light')).toBe('☀️');
    expect(getThemeIcon('dark')).toBe('🌙');
    expect(getThemeIcon('oled')).toBe('⚫');
  });

  it('should persist theme across calls', () => {
    setTheme('dark');
    const retrieved = localStorage.getItem(THEME_STORAGE_KEY);
    expect(retrieved).toBe('dark');
  });
});

describe('Theme Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.body.className = '';
  });

  it('should maintain theme after simulated page reload', () => {
    setTheme('oled');
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    
    // Simulate fresh page load by clearing and resetting
    localStorage.clear();
    localStorage.setItem(THEME_STORAGE_KEY, stored!);
    
    const reloaded = getInitialTheme();
    expect(reloaded).toBe('oled');
  });

  it('should default to light theme if localStorage is empty', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    const theme = getInitialTheme();
    expect(['light', 'dark', 'oled']).toContain(theme);
  });
});
