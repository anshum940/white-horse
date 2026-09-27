import { describe, expect, it } from 'vitest';
import { createPasswordVerifier, hashRecord, stableStringify, verifyPassword } from './security';

describe('security primitives', () => {
  it('canonicalises object key order before hashing', async () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }));
    await expect(hashRecord({ b: 2, a: 1 })).resolves.toBe(await hashRecord({ a: 1, b: 2 }));
  });

  it('creates and verifies a salted password verifier without storing the password', async () => {
    const record = await createPasswordVerifier('correct horse battery staple', 1_000);
    expect(record.verifier).not.toContain('correct horse');
    await expect(verifyPassword('correct horse battery staple', record)).resolves.toBe(true);
    await expect(verifyPassword('incorrect passphrase', record)).resolves.toBe(false);
  });
});
