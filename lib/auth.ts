const ADMIN_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSigningKey(password: string): string {
  return `admin-session:${password}`;
}

async function sign(payload: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is not configured');
  }
  const payload = btoa(JSON.stringify({ t: Date.now() }));
  const signature = await sign(payload, getSigningKey(password));
  return `${payload}.${signature}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !token) return false;

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const receivedSig = token.slice(dotIndex + 1);

  try {
    const data = JSON.parse(atob(payload));
    if (Date.now() - data.t > SESSION_MAX_AGE) return false;

    const expectedSig = await sign(payload, getSigningKey(password));
    if (receivedSig.length !== expectedSig.length) return false;

    // Constant-time comparison to prevent timing attacks
    let mismatch = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      mismatch |= receivedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export const ADMIN_COOKIE = ADMIN_COOKIE_NAME;
