import type { ThemePreference } from '../domain/themePreference';
import { Icon } from './Icon';

export function ThemeToggle({ theme, onToggle, className = '' }: { theme: ThemePreference; onToggle: () => void; className?: string }) {
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon name={theme === 'light' ? 'moon' : 'sun'} size={16}/>
      <span>{nextTheme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
    </button>
  );
}
