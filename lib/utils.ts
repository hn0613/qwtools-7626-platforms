import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 协议常量 — 客户端和服务端共用。
 * Vercel 所有部署环境（生产 + 预览）都用 HTTPS，
 * 因此同时检查 NODE_ENV 和 VERCEL 环境变量。
 */
export const protocol =
  process.env.NODE_ENV === 'production' || process.env.VERCEL
    ? 'https'
    : 'http';

export const rootDomain =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

/**
 * 服务端专用：从请求头 x-forwarded-proto 检测实际协议。
 * 适用于本地 HTTPS 代理、非 Vercel 生产环境等边界场景。
 * 失败时回退到静态 protocol 常量。
 */
export async function getServerProtocol(): Promise<string> {
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-proto');
    if (forwarded) {
      // x-forwarded-proto 可能是逗号分隔的列表（多层代理）
      return forwarded.split(',')[0].trim();
    }
  } catch {
    // headers() 在某些上下文下不可用，回退到静态常量
  }
  return protocol;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
