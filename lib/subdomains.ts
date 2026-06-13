import { redis } from '@/lib/redis';

export function isValidIcon(str: string) {
  if (str.length > 10) {
    return false;
  }

  try {
    // Primary validation: Check if the string contains at least one emoji character
    // This regex pattern matches most emoji Unicode ranges
    const emojiPattern = /[\p{Emoji}]/u;
    if (emojiPattern.test(str)) {
      return true;
    }
  } catch (error) {
    // If the regex fails (e.g., in environments that don't support Unicode property escapes),
    // fall back to a simpler validation
    console.warn(
      'Emoji regex validation failed, using fallback validation',
      error
    );
  }

  // Fallback validation: Check if the string is within a reasonable length
  // This is less secure but better than no validation
  return str.length >= 1 && str.length <= 10;
}

/**
 * Validates a plain text field: trims whitespace, checks non-empty and max length.
 * Returns { valid, value, error } so callers can surface precise messages.
 */
export function validateTextField(
  raw: unknown,
  {
    fieldName,
    maxLength,
    required = true
  }: { fieldName: string; maxLength: number; required?: boolean }
): { valid: boolean; value: string; error?: string } {
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (required && value.length === 0) {
    return { valid: false, value, error: `${fieldName} is required` };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      value,
      error: `${fieldName} must be at most ${maxLength} characters`
    };
  }

  return { valid: true, value };
}

/**
 * Canonical shape of tenant data stored in Redis.
 *
 * New fields (added later) MUST be optional so that tenants created before
 * the field existed continue to load without errors or migrations.
 * Use `resolveTenantDisplay()` to derive safe display values with defaults.
 */
export type SubdomainData = {
  emoji: string;
  createdAt: number;
  /** Public display name of the tenant (e.g. "Acme Corp"). */
  name?: string;
  /** Short one-liner shown under the name (e.g. "Build the future"). */
  tagline?: string;
  /** Longer description shown on the tenant landing page. */
  description?: string;
  /** Hero headline on the tenant landing page. */
  headline?: string;
};

/** Input limits used across validation, forms and server actions. */
export const TENANT_FIELD_LIMITS = {
  name: { maxLength: 80, required: true },
  tagline: { maxLength: 120, required: false },
  description: { maxLength: 500, required: false },
  headline: { maxLength: 120, required: false }
} as const;

/**
 * Derives display-ready values from a tenant record, filling in defaults for
 * any fields that are missing (old tenants) or empty. Centralises the
 * "what do we show?" logic so pages and admin UI stay in sync.
 */
export function resolveTenantDisplay(
  data: SubdomainData,
  subdomain: string
) {
  const name = data.name?.trim() || subdomain;
  const tagline = data.tagline?.trim() || '';
  const description =
    data.description?.trim() ||
    `Welcome to ${name}'s space on ${subdomain}.`;
  const headline = data.headline?.trim() || `Welcome to ${name}`;

  return { name, tagline, description, headline };
}

export async function getSubdomainData(subdomain: string) {
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const data = await redis.get<SubdomainData>(
    `subdomain:${sanitizedSubdomain}`
  );
  return data;
}

export async function getAllSubdomains() {
  const keys = await redis.keys('subdomain:*');

  if (!keys.length) {
    return [];
  }

  const values = await redis.mget<SubdomainData[]>(...keys);

  return keys.map((key, index) => {
    const subdomain = key.replace('subdomain:', '');
    const data = values[index];

    return {
      subdomain,
      emoji: data?.emoji || '❓',
      createdAt: data?.createdAt || Date.now(),
      name: data?.name,
      tagline: data?.tagline,
      description: data?.description,
      headline: data?.headline
    };
  });
}
