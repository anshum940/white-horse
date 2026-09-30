import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LoginCover } from './LoginCover';

describe('White Horse login cover', () => {
  it('renders a branded, accessible study access form without exposing the password', () => {
    const html = renderToStaticMarkup(<LoginCover onAuthenticated={() => undefined} theme="light" onToggleTheme={() => undefined}/>);

    expect(html).toContain('WHITE HORSE');
    expect(html).toContain('Financial statements,');
    expect(html).toContain('autoComplete="username"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('type="password"');
    expect(html).toContain('Enter White Horse');
    expect(html).toContain('Study access cover');
    expect(html).toContain('Switch to dark mode');
    expect(html).not.toContain('admin123');
  });
});
