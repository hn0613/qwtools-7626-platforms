import { type NextRequest, NextResponse } from 'next/server';
import { extractSubdomainFromHost } from '@/lib/domain';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const subdomain = extractSubdomainFromHost(host);

  if (subdomain) {
    // Block access to admin page from subdomains — redirect to subdomain root
    if (pathname.startsWith('/admin')) {
      const target = request.nextUrl.clone();
      target.pathname = '/';
      return NextResponse.redirect(target);
    }

    // Rewrite all subdomain requests to the internal tenant route
    const target = request.nextUrl.clone();
    target.pathname = `/s/${subdomain}`;
    return NextResponse.rewrite(target);
  }

  // On the root domain, allow normal access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api|_next|[\\w-]+\\.\\w+).*)'
  ]
};
