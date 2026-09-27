import { describe, expect, it } from 'vitest';
import { getStoragePersistenceStatus, requestStoragePersistence } from './storagePersistence';

function storageManager(result: boolean): Pick<StorageManager, 'persist' | 'persisted'> {
  return {
    persist: async () => result,
    persisted: async () => result
  };
}

describe('browser storage persistence', () => {
  it('reports persistent and best-effort states', async () => {
    await expect(getStoragePersistenceStatus(storageManager(true))).resolves.toBe('PERSISTENT');
    await expect(getStoragePersistenceStatus(storageManager(false))).resolves.toBe('BEST_EFFORT');
    await expect(requestStoragePersistence(storageManager(true))).resolves.toBe('PERSISTENT');
    await expect(requestStoragePersistence(storageManager(false))).resolves.toBe('BEST_EFFORT');
  });

  it('reports unsupported and unavailable APIs without throwing', async () => {
    await expect(getStoragePersistenceStatus(undefined)).resolves.toBe('UNSUPPORTED');
    await expect(requestStoragePersistence(undefined)).resolves.toBe('UNSUPPORTED');
    const failing = {
      persist: async () => { throw new Error('denied'); },
      persisted: async () => { throw new Error('blocked'); }
    } as Pick<StorageManager, 'persist' | 'persisted'>;
    await expect(getStoragePersistenceStatus(failing)).resolves.toBe('UNAVAILABLE');
    await expect(requestStoragePersistence(failing)).resolves.toBe('UNAVAILABLE');
  });
});
