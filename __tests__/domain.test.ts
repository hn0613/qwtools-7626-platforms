import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/utils', () => ({
  protocol: 'https',
  rootDomain: 'example.com',
}));

import {
  extractSubdomainFromHost,
  buildTenantUrl,
  buildRootUrl,
  isLocalhost,
} from '@/lib/domain';

// ---------- isLocalhost ----------

describe('isLocalhost', () => {
  it('returns true for localhost', () => {
    expect(isLocalhost('localhost')).toBe(true);
  });

  it('returns true for *.localhost', () => {
    expect(isLocalhost('tenant.localhost')).toBe(true);
  });

  it('returns true for 127.0.0.1', () => {
    expect(isLocalhost('127.0.0.1')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isLocalhost('LOCALHOST')).toBe(true);
    expect(isLocalhost('Tenant.Localhost')).toBe(true);
  });

  it('returns false for normal domains', () => {
    expect(isLocalhost('example.com')).toBe(false);
    expect(isLocalhost('localhost.example.com')).toBe(false);
  });
});

// ---------- extractSubdomainFromHost ----------

describe('extractSubdomainFromHost', () => {
  // -- Edge cases --

  it('returns null for empty host', () => {
    expect(extractSubdomainFromHost('', 'example.com')).toBeNull();
  });

  it('returns null for undefined-like input', () => {
    expect(extractSubdomainFromHost('', '')).toBeNull();
  });

  // -- Local development --

  describe('local development', () => {
    it('returns null for bare localhost', () => {
      expect(extractSubdomainFromHost('localhost', 'localhost:3000')).toBeNull();
    });

    it('returns null for localhost with port', () => {
      expect(extractSubdomainFromHost('localhost:3000', 'localhost:3000')).toBeNull();
    });

    it('returns null for 127.0.0.1', () => {
      expect(extractSubdomainFromHost('127.0.0.1', 'localhost:3000')).toBeNull();
    });

    it('returns null for 127.0.0.1 with port', () => {
      expect(extractSubdomainFromHost('127.0.0.1:3000', 'localhost:3000')).toBeNull();
    });

    it('extracts subdomain from tenant.localhost', () => {
      expect(extractSubdomainFromHost('tenant.localhost', 'localhost:3000')).toBe('tenant');
    });

    it('extracts subdomain from tenant.localhost:3000', () => {
      expect(extractSubdomainFromHost('tenant.localhost:3000', 'localhost:3000')).toBe('tenant');
    });

    it('handles case-insensitive localhost tenant', () => {
      expect(extractSubdomainFromHost('Tenant.Localhost:3000', 'localhost:3000')).toBe('tenant');
    });

    it('returns null for empty subdomain (.localhost)', () => {
      expect(extractSubdomainFromHost('.localhost:3000', 'localhost:3000')).toBeNull();
    });
  });

  // -- Vercel preview deployments --

  describe('Vercel preview', () => {
    it('extracts tenant from tenant---branch.vercel.app', () => {
      expect(extractSubdomainFromHost('mytenant---main.vercel.app', 'example.com')).toBe('mytenant');
    });

    it('extracts tenant from complex branch names', () => {
      expect(extractSubdomainFromHost('shop---feat-auth-flow.vercel.app', 'example.com')).toBe('shop');
    });

    it('returns null for ---branch.vercel.app (empty tenant)', () => {
      expect(extractSubdomainFromHost('---main.vercel.app', 'example.com')).toBeNull();
    });

    it('handles case-insensitive preview hostnames', () => {
      expect(extractSubdomainFromHost('MyTenant---Main.Vercel.App', 'example.com')).toBe('mytenant');
    });

    it('treats --- on non-vercel domains as a regular subdomain', () => {
      expect(extractSubdomainFromHost('foo---bar.example.com', 'example.com')).toBe('foo---bar');
    });
  });

  // -- Production --

  describe('production', () => {
    it('returns null for root domain', () => {
      expect(extractSubdomainFromHost('example.com', 'example.com')).toBeNull();
    });

    it('returns null for www prefix', () => {
      expect(extractSubdomainFromHost('www.example.com', 'example.com')).toBeNull();
    });

    it('extracts tenant subdomain', () => {
      expect(extractSubdomainFromHost('tenant.example.com', 'example.com')).toBe('tenant');
    });

    it('extracts nested subdomain', () => {
      expect(extractSubdomainFromHost('deep.tenant.example.com', 'example.com')).toBe('deep.tenant');
    });

    it('handles case-insensitive matching', () => {
      expect(extractSubdomainFromHost('Tenant.Example.COM', 'example.com')).toBe('tenant');
    });

    it('handles case-insensitive rootDomain', () => {
      expect(extractSubdomainFromHost('tenant.example.com', 'Example.COM')).toBe('tenant');
    });

    it('returns null for unrelated domain', () => {
      expect(extractSubdomainFromHost('other.com', 'example.com')).toBeNull();
    });

    it('returns null for domain that only partially matches', () => {
      expect(extractSubdomainFromHost('notexample.com', 'example.com')).toBeNull();
    });

    it('handles rootDomain with port', () => {
      expect(extractSubdomainFromHost('tenant.example.com:8080', 'example.com:8080')).toBe('tenant');
    });

    it('returns null for root domain with port', () => {
      expect(extractSubdomainFromHost('example.com:8080', 'example.com:8080')).toBeNull();
    });

    it('returns null for www with port', () => {
      expect(extractSubdomainFromHost('www.example.com:8080', 'example.com:8080')).toBeNull();
    });
  });

  // -- Uses default rootDomain from mocked utils --

  describe('default rootDomain', () => {
    it('uses the mocked rootDomain (example.com) by default', () => {
      expect(extractSubdomainFromHost('tenant.example.com')).toBe('tenant');
    });

    it('returns null for root domain by default', () => {
      expect(extractSubdomainFromHost('example.com')).toBeNull();
    });
  });
});

// ---------- URL builders ----------

describe('buildTenantUrl', () => {
  it('builds correct tenant URL', () => {
    expect(buildTenantUrl('mysite')).toBe('https://mysite.example.com');
  });
});

describe('buildRootUrl', () => {
  it('builds correct root URL', () => {
    expect(buildRootUrl()).toBe('https://example.com');
  });
});
