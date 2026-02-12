import { h } from 'preact';
import type { Theme } from '../types';
import { getThemeIcon, getNextTheme, setTheme } from '../utils/theme';

interface Props {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  disabled?: boolean;
}

export function ThemeSwitcher({ currentTheme, onThemeChange, disabled }: Props) {
  const handleClick = () => {
    if (disabled) return;
    const nextTheme = getNextTheme(currentTheme);
    setTheme(nextTheme);
    onThemeChange(nextTheme);
  };

  return (
    <button
      className="theme-switcher"
      onClick={handleClick}
      disabled={disabled}
      title={`Current theme: ${currentTheme}`}
      aria-label="Toggle theme"
    >
      {getThemeIcon(currentTheme)}
    </button>
  );
}
