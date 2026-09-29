import { sha256 } from './security';

const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD_DIGEST = 'sha256:240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
const DEMO_SESSION_KEY = 'white-horse-demo-access';
const DEMO_SESSION_VALUE = 'granted';

function constantTimeTextEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export async function verifyDemoCredentials(username: string, password: string): Promise<boolean> {
  const normalisedUsername = username.trim().toLowerCase();
  const [usernameMatches, passwordDigest] = await Promise.all([
    Promise.resolve(constantTimeTextEqual(normalisedUsername, DEMO_USERNAME)),
    sha256(password)
  ]);
  return usernameMatches && constantTimeTextEqual(passwordDigest, DEMO_PASSWORD_DIGEST);
}

export function hasDemoAccessSession(): boolean {
  return sessionStorage.getItem(DEMO_SESSION_KEY) === DEMO_SESSION_VALUE;
}

export function startDemoAccessSession(): void {
  sessionStorage.setItem(DEMO_SESSION_KEY, DEMO_SESSION_VALUE);
}

export function endDemoAccessSession(): void {
  sessionStorage.removeItem(DEMO_SESSION_KEY);
}
