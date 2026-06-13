import { redis } from '@/lib/redis';
import {
  type Tenant,
  type TenantRecord,
  sanitizeSubdomain,
  normalizeTenant,
  DEFAULT_CREATED_AT
} from '@/lib/tenant';

/**
 * 读取单个租户数据。
 * 返回标准化的 Tenant，找不到时返回 null。
 */
export async function getSubdomainData(subdomain: string): Promise<Tenant | null> {
  const sanitized = sanitizeSubdomain(subdomain);
  if (!sanitized) return null;

  const raw = await redis.get<TenantRecord>(`subdomain:${sanitized}`);
  if (!raw) return null;

  return normalizeTenant(sanitized, raw);
}

/**
 * 列出所有租户，按 createdAt 降序排列（最新在前）。
 * createdAt 相同则按 subdomain 字母序。
 * 缺失 createdAt 的记录（值为 0）排在最后。
 * 单条记录异常时跳过，不影响整个列表。
 */
export async function getAllTenants(): Promise<Tenant[]> {
  const keys = await redis.keys('subdomain:*');

  if (!keys.length) {
    return [];
  }

  const values = await redis.mget<TenantRecord[]>(...keys);

  const tenants: Tenant[] = [];

  for (let i = 0; i < keys.length; i++) {
    try {
      const subdomain = keys[i].replace('subdomain:', '');
      const raw = values[i];
      tenants.push(normalizeTenant(subdomain, raw));
    } catch (error) {
      // 单条记录异常时跳过，避免一条脏数据带崩整页
      console.warn(`Skipping malformed tenant record for key: ${keys[i]}`, error);
    }
  }

  // 稳定排序：createdAt 降序 → subdomain 字母序
  // DEFAULT_CREATED_AT (0) 的记录自然排到最后
  tenants.sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      return b.createdAt - a.createdAt;
    }
    return a.subdomain.localeCompare(b.subdomain);
  });

  return tenants;
}
