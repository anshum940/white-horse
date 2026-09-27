import { db } from '../db';
import { sha256, stableStringify } from '../domain/security';
import type {
  Adjustment,
  AdjustmentLine,
  AuditEvent,
  Company,
  LedgerAccount,
  LedgerMapping,
  LocalUser,
  NoteDisclosure,
  ReportingPeriod,
  TrialBalanceImport,
  ValidationResult
} from '../domain/types';

interface BackupPayload {
  companies: Company[];
  periods: ReportingPeriod[];
  imports: TrialBalanceImport[];
  ledgers: LedgerAccount[];
  mappings: LedgerMapping[];
  adjustments: Adjustment[];
  adjustmentLines: AdjustmentLine[];
  validations: ValidationResult[];
  notes: NoteDisclosure[];
  auditEvents: AuditEvent[];
  users: LocalUser[];
}
interface PlainBackupEnvelope {
  formatName: 'white-horse-backup';
  formatVersion: 1;
  schemaVersion: 1;
  applicationVersion: string;
  createdAt: string;
  encrypted: false;
  payloadHash: string;
  tableCounts: Record<keyof BackupPayload, number>;
  payload: BackupPayload;
}

interface EncryptedBackupEnvelope {
  formatName: 'white-horse-backup';
  formatVersion: 1;
  schemaVersion: 1;
  applicationVersion: string;
  createdAt: string;
  encrypted: true;
  encryption: {
    algorithm: 'AES-GCM-256';
    kdf: 'PBKDF2-SHA-256';
    iterations: number;
    salt: string;
    iv: string;
  };
  ciphertext: string;
}

export type BackupEnvelope = PlainBackupEnvelope | EncryptedBackupEnvelope;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveBackupKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function readPayload(): Promise<BackupPayload> {
  const [companies, periods, imports, ledgers, mappings, adjustments, adjustmentLines, validations, notes, auditEvents, users] =
    await Promise.all([
      db.companies.toArray(),
      db.periods.toArray(),
      db.imports.toArray(),
      db.ledgers.toArray(),
      db.mappings.toArray(),
      db.adjustments.toArray(),
      db.adjustmentLines.toArray(),
      db.validations.toArray(),
      db.notes.toArray(),
      db.auditEvents.toArray(),
      db.users.toArray()
    ]);
  return { companies, periods, imports, ledgers, mappings, adjustments, adjustmentLines, validations, notes, auditEvents, users };
}

function tableCounts(payload: BackupPayload): Record<keyof BackupPayload, number> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, values]) => [key, values.length])
  ) as Record<keyof BackupPayload, number>;
}

export async function createBackupBlob(passphrase?: string): Promise<{ blob: Blob; fileName: string; encrypted: boolean }> {
  const payload = await readPayload();
  const createdAt = new Date().toISOString();
  const applicationVersion = import.meta.env.VITE_APP_VERSION ?? '0.1.0';
  let envelope: BackupEnvelope;

  if (passphrase) {
    if (passphrase.length < 12) throw new Error('Backup passphrase must contain at least 12 characters.');
    const iterations = 310_000;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveBackupKey(passphrase, salt, iterations);
    const inner = stableStringify({ payload, payloadHash: await sha256(stableStringify(payload)), tableCounts: tableCounts(payload) });
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, encoder.encode(inner));
    envelope = {
      formatName: 'white-horse-backup',
      formatVersion: 1,
      schemaVersion: 1,
      applicationVersion,
      createdAt,
      encrypted: true,
      encryption: {
        algorithm: 'AES-GCM-256',
        kdf: 'PBKDF2-SHA-256',
        iterations,
        salt: toBase64(salt),
        iv: toBase64(iv)
      },
      ciphertext: toBase64(new Uint8Array(ciphertext))
    };
  } else {
    envelope = {
      formatName: 'white-horse-backup',
      formatVersion: 1,
      schemaVersion: 1,
      applicationVersion,
      createdAt,
      encrypted: false,
      payloadHash: await sha256(stableStringify(payload)),
      tableCounts: tableCounts(payload),
      payload
    };
  }

  const stamp = createdAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return {
    blob: new Blob([JSON.stringify(envelope, null, envelope.encrypted ? 0 : 2)], { type: 'application/json' }),
    fileName: `WhiteHorse_backup_${stamp}.${envelope.encrypted ? 'whbackup' : 'json'}`,
    encrypted: envelope.encrypted
  };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function isPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return ['companies', 'periods', 'imports', 'ledgers', 'mappings', 'adjustments', 'adjustmentLines', 'validations', 'notes', 'auditEvents', 'users'].every(
    (key) => Array.isArray(candidate[key])
  );
}

export async function readBackupFile(file: File, passphrase?: string): Promise<{ payload: BackupPayload; envelope: BackupEnvelope }> {
  if (file.size > 100 * 1024 * 1024) throw new Error('Backup exceeds the 100 MB safety limit.');
  let envelope: BackupEnvelope;
  try {
    envelope = JSON.parse(await file.text()) as BackupEnvelope;
  } catch {
    throw new Error('Backup is not valid JSON.');
  }
  if (envelope.formatName !== 'white-horse-backup' || envelope.formatVersion !== 1 || envelope.schemaVersion !== 1) {
    throw new Error('Unsupported White Horse backup format or schema version.');
  }

  if (!envelope.encrypted) {
    if (!isPayload(envelope.payload)) throw new Error('Backup payload structure is invalid.');
    const hash = await sha256(stableStringify(envelope.payload));
    if (hash !== envelope.payloadHash) throw new Error('Backup integrity verification failed.');
    return { payload: envelope.payload, envelope };
  }

  if (!passphrase) throw new Error('This backup is encrypted; enter its passphrase.');
  try {
    const salt = fromBase64(envelope.encryption.salt);
    const iv = fromBase64(envelope.encryption.iv);
    const key = await deriveBackupKey(passphrase, salt, envelope.encryption.iterations);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      fromBase64(envelope.ciphertext) as BufferSource
    );
    const inner = JSON.parse(decoder.decode(plaintext)) as { payload: unknown; payloadHash: string };
    if (!isPayload(inner.payload)) throw new Error('Decrypted payload structure is invalid.');
    const hash = await sha256(stableStringify(inner.payload));
    if (hash !== inner.payloadHash) throw new Error('Backup integrity verification failed.');
    return { payload: inner.payload, envelope };
  } catch (error) {
    if (error instanceof Error && error.message.includes('payload')) throw error;
    throw new Error('Unable to decrypt backup. The passphrase may be incorrect or the file may be damaged.');
  }
}

export async function restoreBackupPayload(payload: BackupPayload): Promise<void> {
  await db.transaction(
    'rw',
    [db.companies, db.periods, db.imports, db.ledgers, db.mappings, db.adjustments, db.adjustmentLines, db.validations, db.notes, db.auditEvents, db.users],
    async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
      await db.companies.bulkPut(payload.companies);
      await db.periods.bulkPut(payload.periods);
      await db.imports.bulkPut(payload.imports);
      await db.ledgers.bulkPut(payload.ledgers);
      await db.mappings.bulkPut(payload.mappings);
      await db.adjustments.bulkPut(payload.adjustments);
      await db.adjustmentLines.bulkPut(payload.adjustmentLines);
      await db.validations.bulkPut(payload.validations);
      await db.notes.bulkPut(payload.notes);
      await db.auditEvents.bulkPut(payload.auditEvents);
      await db.users.bulkPut(payload.users);
    }
  );
}
