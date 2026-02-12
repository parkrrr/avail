import { h } from 'preact';
import type { Theme } from '../types';
import { getThemeIcon, getNextTheme, setTheme } from '../utils/theme';

interface Props {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: Props) {
  const handleClick = () => {
    const nextTheme = getNextTheme(currentTheme);
    setTheme(nextTheme);
    onThemeChange(nextTheme);
  };

  return (
    <button
      className="theme-switcher"
      onClick={handleClick}
      title={`Current theme: ${currentTheme}`}
      aria-label="Toggle theme"
    >
      {getThemeIcon(currentTheme)}
    </button>
  );
}
