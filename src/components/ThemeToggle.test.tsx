import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

afterEach(() => { document.body.innerHTML = ''; });

describe('one-click theme control', () => {
  it('offers the opposite mode with an accessible name on login and workspace', async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const toggle = vi.fn();
    await act(async () => root.render(<ThemeToggle theme="light" onToggle={toggle}/>));
    const button = host.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    await act(async () => button.click());
    expect(toggle).toHaveBeenCalledTimes(1);
    await act(async () => root.render(<ThemeToggle theme="dark" onToggle={toggle}/>));
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    await act(async () => root.unmount());
  });
});
