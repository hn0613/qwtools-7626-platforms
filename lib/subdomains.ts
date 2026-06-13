import { redis } from '@/lib/redis';

// --- Validation ---

export function isValidIcon(str: string) {
  if (str.length > 10) {
    return false;
  }

  try {
    const emojiPattern = /[\p{Emoji}]/u;
    if (emojiPattern.test(str)) {
      return true;
    }
  } catch (error) {
    console.warn(
      'Emoji regex validation failed, using fallback validation',
      error
    );
  }

  return str.length >= 1 && str.length <= 10;
}

// --- Types ---

export type Tenant = {
  subdomain: string;
  emoji: string;
  createdAt: number; // ms timestamp, 0 = unknown
};

type SubdomainRecord = {
  emoji: string;
  createdAt: number;
};

// --- Helpers ---

const DEFAULTS = {
  emoji: '❓',
  createdAt: 0,
} as const;

export function sanitizeSubdomain(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

function tenantKey(subdomain: string): string {
  return `subdomain:${subdomain}`;
}

function normalizeTenant(
  subdomain: string,
  data: SubdomainRecord | null
): Tenant {
  return {
    subdomain,
    emoji: data?.emoji || DEFAULTS.emoji,
    createdAt: data?.createdAt || DEFAULTS.createdAt,
  };
}

// --- Read ---

export async function getSubdomainData(
  subdomain: string
): Promise<Tenant | null> {
  const sanitized = sanitizeSubdomain(subdomain);
  const data = await redis.get<SubdomainRecord>(tenantKey(sanitized));
  if (!data) return null;
  return normalizeTenant(sanitized, data);
}

export async function getAllSubdomains(): Promise<Tenant[]> {
  const keys = await redis.keys('subdomain:*');
  if (!keys.length) return [];

  const values = await redis.mget<SubdomainRecord[]>(...keys);

  const tenants = keys.map((key, index) => {
    const subdomain = key.replace('subdomain:', '');
    return normalizeTenant(subdomain, values[index]);
  });

  return tenants.sort((a, b) => {
    if (a.createdAt === 0 && b.createdAt === 0) return 0;
    if (a.createdAt === 0) return 1;
    if (b.createdAt === 0) return -1;
    return b.createdAt - a.createdAt;
  });
}

// --- Write ---

export async function createTenant(
  subdomain: string,
  emoji: string
): Promise<void> {
  const record: SubdomainRecord = { emoji, createdAt: Date.now() };
  await redis.set(tenantKey(subdomain), record);
}

export async function deleteTenant(subdomain: string): Promise<void> {
  const sanitized = sanitizeSubdomain(subdomain);
  await redis.del(tenantKey(sanitized));
}

export async function tenantExists(subdomain: string): Promise<boolean> {
  const data = await redis.get(tenantKey(subdomain));
  return data !== null;
}
