import { type NextRequest, NextResponse } from 'next/server';
import { rootDomain } from '@/lib/utils';

/** 合法子域格式：小写字母、数字、连字符 */
const SUBDOMAIN_RE = /^[a-z0-9-]+$/;

function extractSubdomain(request: NextRequest): string | null {
  const host = request.headers.get('host') || '';
  // 统一小写 + 去端口，消除大小写和端口差异
  const hostname = host.toLowerCase().split(':')[0];

  if (!hostname) return null;

  // ── 本地开发环境 ──
  // 完全基于 hostname 判断，不依赖 request.url（避免查询参数干扰）
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return null; // 裸本地地址 → 根站
  }
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.split('.')[0];
    return sub && SUBDOMAIN_RE.test(sub) ? sub : null;
  }

  // ── Vercel 预览部署 ──
  // 格式: tenant---branch-name.vercel.app
  if (hostname.includes('---') && hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('---');
    const sub = parts[0];
    return sub && SUBDOMAIN_RE.test(sub) ? sub : null;
  }

  // ── 正式环境 ──
  const rootDomainFormatted = rootDomain.toLowerCase().split(':')[0];

  // 排除根域名和 www.根域名，只匹配 *.根域名
  const isSubdomain =
    hostname !== rootDomainFormatted &&
    hostname !== `www.${rootDomainFormatted}` &&
    hostname.endsWith(`.${rootDomainFormatted}`);

  if (!isSubdomain) return null;

  // 用 slice 精确去掉末尾的 .rootDomain，比 replace 更可靠
  const sub = hostname.slice(0, -(rootDomainFormatted.length + 1));
  return sub && SUBDOMAIN_RE.test(sub) ? sub : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = extractSubdomain(request);

  if (subdomain) {
    const host = request.headers.get('host') || '';
    const origin = `${request.nextUrl.protocol}//${host}`;

    // 租户子域禁止访问 /admin → 重定向回租户首页
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', origin));
    }

    // 租户首页 → 内部改写到 /s/{subdomain}
    if (pathname === '/') {
      return NextResponse.rewrite(new URL(`/s/${subdomain}`, origin));
    }
  }

  // 根域名正常放行
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
