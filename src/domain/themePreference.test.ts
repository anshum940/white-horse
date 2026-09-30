import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyThemePreference, readThemePreference, THEME_STORAGE_KEY } from './themePreference';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.removeItem(THEME_STORAGE_KEY);
  delete document.documentElement.dataset.theme;
});

describe('screen theme preference', () => {
  it('defaults to light and retains a chosen dark or light mode across reads', () => {
    expect(readThemePreference()).toBe('light');
    applyThemePreference('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(readThemePreference()).toBe('dark');
    applyThemePreference('light');
    expect(readThemePreference()).toBe('light');
  });

  it('uses the light fallback for unknown or inaccessible storage', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'unknown');
    expect(readThemePreference()).toBe('light');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Storage denied', 'SecurityError'); });
    expect(readThemePreference()).toBe('light');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Storage denied', 'SecurityError'); });
    expect(() => applyThemePreference('dark')).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
