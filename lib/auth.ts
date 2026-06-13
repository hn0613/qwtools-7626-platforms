export const SESSION_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

async function hmacSign(message: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(message)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionToken(): Promise<string> {
  const password = getAdminPassword();
  if (!password) throw new Error('ADMIN_PASSWORD is not configured');
  const expiry = Date.now() + SESSION_MAX_AGE * 1000;
  const signature = await hmacSign(String(expiry), password);
  return `${expiry}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const password = getAdminPassword();
  if (!password) return false;

  const dotIndex = token.indexOf('.');
  if (dotIndex === -1) return false;

  const expiry = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);

  const expiryTime = Number(expiry);
  if (isNaN(expiryTime) || Date.now() > expiryTime) return false;

  const expected = await hmacSign(expiry, password);
  return timingSafeEqual(signature, expected);
}
