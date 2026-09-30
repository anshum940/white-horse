export type ThemePreference = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'white-horse-theme';

export function readThemePreference(): ThemePreference {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyThemePreference(theme: ThemePreference): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The theme still works for this page when browser storage is unavailable.
  }
}
