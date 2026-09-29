import { beforeEach, describe, expect, it } from 'vitest';
import {
  endDemoAccessSession,
  hasDemoAccessSession,
  startDemoAccessSession,
  verifyDemoCredentials
} from './demoAuthentication';

describe('White Horse demonstration access gate', () => {
  beforeEach(() => sessionStorage.clear());

  it('accepts only the configured case-insensitive username and exact password', async () => {
    await expect(verifyDemoCredentials('admin', 'admin123')).resolves.toBe(true);
    await expect(verifyDemoCredentials(' ADMIN ', 'admin123')).resolves.toBe(true);
    await expect(verifyDemoCredentials('admin', 'Admin123')).resolves.toBe(false);
    await expect(verifyDemoCredentials('abhijit', 'admin123')).resolves.toBe(false);
  });

  it('keeps only a non-secret tab-scoped access marker', () => {
    expect(hasDemoAccessSession()).toBe(false);
    startDemoAccessSession();
    expect(hasDemoAccessSession()).toBe(true);
    const storedValues = Array.from({ length: sessionStorage.length }, (_, index) => {
      const key = sessionStorage.key(index);
      return key ? sessionStorage.getItem(key) : null;
    });
    expect(storedValues).not.toContain('admin123');
    endDemoAccessSession();
    expect(hasDemoAccessSession()).toBe(false);
  });
});
