export type StoragePersistenceStatus = 'CHECKING' | 'PERSISTENT' | 'BEST_EFFORT' | 'UNSUPPORTED' | 'UNAVAILABLE';

type StorageManagerLike = Pick<StorageManager, 'persist' | 'persisted'>;

function browserStorageManager(): StorageManagerLike | undefined {
  if (typeof navigator === 'undefined' || !navigator.storage) return undefined;
  return navigator.storage;
}

export async function getStoragePersistenceStatus(
  storage: StorageManagerLike | undefined = browserStorageManager()
): Promise<StoragePersistenceStatus> {
  if (!storage || typeof storage.persisted !== 'function') return 'UNSUPPORTED';
  try {
    return (await storage.persisted()) ? 'PERSISTENT' : 'BEST_EFFORT';
  } catch {
    return 'UNAVAILABLE';
  }
}

export async function requestStoragePersistence(
  storage: StorageManagerLike | undefined = browserStorageManager()
): Promise<StoragePersistenceStatus> {
  if (!storage || typeof storage.persist !== 'function') return 'UNSUPPORTED';
  try {
    return (await storage.persist()) ? 'PERSISTENT' : 'BEST_EFFORT';
  } catch {
    return 'UNAVAILABLE';
  }
}
