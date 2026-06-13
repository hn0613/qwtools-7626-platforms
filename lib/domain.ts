import { protocol, rootDomain } from '@/lib/utils';

/**
 * Check whether a hostname (without port) refers to a local development address.
 */
export function isLocalhost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h.endsWith('.localhost') || h === '127.0.0.1';
}

/**
 * Extract the tenant subdomain from a Host header value.
 *
 * Returns the lowercase subdomain name, or `null` when the request targets the
 * root domain, www, or a non-tenant host.
 *
 * Works for:
 *  - Local dev:        tenant.localhost:3000
 *  - Vercel preview:   tenant---branch.vercel.app
 *  - Production:       tenant.example.com
 */
export function extractSubdomainFromHost(
  host: string,
  root: string = rootDomain
): string | null {
  if (!host) return null;

  // Normalise: lowercase and strip port from both sides
  const hostname = host.toLowerCase().split(':')[0];
  const rootHostname = root.toLowerCase().split(':')[0];

  if (!hostname) return null;

  // ---- Local development (localhost / 127.0.0.1) ----
  if (hostname === '127.0.0.1' || hostname === 'localhost') {
    // Bare localhost / IP — no subdomain
    return null;
  }

  if (hostname.endsWith('.localhost')) {
    const sub = hostname.slice(0, -'.localhost'.length);
    return sub || null;
  }

  // ---- Vercel preview deployments (tenant---branch.vercel.app) ----
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const sub = hostname.split('---')[0];
    return sub || null; // guard against "---branch.vercel.app"
  }

  // ---- Production / custom domain ----
  if (!rootHostname) return null;

  const suffix = `.${rootHostname}`;

  // Root domain itself or www — not a tenant
  if (hostname === rootHostname || hostname === `www.${rootHostname}`) {
    return null;
  }

  if (hostname.endsWith(suffix)) {
    const sub = hostname.slice(0, -suffix.length);
    return sub || null;
  }

  // Hostname doesn't belong to the root domain at all
  return null;
}

/** Build a full URL pointing to a tenant subdomain. */
export function buildTenantUrl(subdomain: string): string {
  return `${protocol}://${subdomain}.${rootDomain}`;
}

/** Build a full URL pointing to the root domain. */
export function buildRootUrl(): string {
  return `${protocol}://${rootDomain}`;
}
