const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

export async function sha256(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export interface PasswordVerifier {
  salt: string;
  verifier: string;
  iterations: number;
  algorithm: 'PBKDF2-SHA-256';
}

async function derivePasswordBytes(passphrase: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    baseKey,
    256
  );
  return new Uint8Array(bits);
}

export async function createPasswordVerifier(passphrase: string, iterations = 310_000): Promise<PasswordVerifier> {
  if (passphrase.length < 12) throw new Error('Passphrase must contain at least 12 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifier = await derivePasswordBytes(passphrase, salt, iterations);
  return {
    salt: bytesToBase64(salt),
    verifier: bytesToBase64(verifier),
    iterations,
    algorithm: 'PBKDF2-SHA-256'
  };
}

export async function verifyPassword(passphrase: string, record: PasswordVerifier): Promise<boolean> {
  const expected = base64ToBytes(record.verifier);
  const actual = await derivePasswordBytes(passphrase, base64ToBytes(record.salt), record.iterations);
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= (expected[index] ?? 0) ^ (actual[index] ?? 0);
  }
  return difference === 0;
}

export async function hashRecord(value: unknown): Promise<string> {
  return sha256(stableStringify(value));
}
