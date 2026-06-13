// ──────────────────────────────────────────────────────────
// lib/tenant.ts — 租户数据规则的唯一来源
// 类型、常量、清洗、校验、标准化都在这里
// ──────────────────────────────────────────────────────────

// ── 类型 ──

/** 完整的租户信息，所有对外接口统一使用这个结构 */
export type Tenant = {
  subdomain: string;
  emoji: string;
  createdAt: number;
};

/**
 * Redis 中实际存储的结构。
 * 字段标记为可选，以兼容早期写入的残缺记录。
 */
export type TenantRecord = {
  emoji?: string;
  createdAt?: number;
};

// ── 常量 ──

/** 不允许注册的子域名（路由/系统保留） */
export const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'www',
  'api',
  '_next',
  's',
  'mail',
  'ftp'
]);

export const MIN_SUBDOMAIN_LENGTH = 3;
export const MAX_SUBDOMAIN_LENGTH = 63;

/** 旧记录缺少 emoji 时的兜底值 */
export const DEFAULT_EMOJI = '❓';

/**
 * 旧记录缺少 createdAt 时的兜底值。
 * 使用 0 而不是 Date.now()，这样：
 * - 不会伪造出"刚刚创建"的假象
 * - 排序时这类记录稳定地排在最后
 */
export const DEFAULT_CREATED_AT = 0;

// ── 清洗 ──

/**
 * 唯一的 subdomain 清洗实现。
 * 创建、读取、删除、路由等所有入口都调用此函数。
 */
export function sanitizeSubdomain(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '');
}

// ── 校验 ──

/**
 * 校验子域名是否可用。
 * 返回 null 表示通过，否则返回人可读的错误信息。
 * 注意：此函数对原始输入做校验（不做 sanitize），
 * 调用方应先比对 sanitize 结果再调此函数。
 */
export function validateSubdomain(input: string): string | null {
  if (!input || input.length === 0) {
    return 'Subdomain is required';
  }
  if (input.length < MIN_SUBDOMAIN_LENGTH) {
    return `Subdomain must be at least ${MIN_SUBDOMAIN_LENGTH} characters`;
  }
  if (input.length > MAX_SUBDOMAIN_LENGTH) {
    return `Subdomain must be at most ${MAX_SUBDOMAIN_LENGTH} characters`;
  }
  if (!/^[a-z0-9-]+$/.test(input)) {
    return 'Subdomain can only contain lowercase letters, numbers, and hyphens';
  }
  if (RESERVED_SUBDOMAINS.has(input)) {
    return 'This subdomain is reserved';
  }
  return null;
}

/**
 * 校验 emoji/图标输入。
 * 主逻辑用 Unicode 属性正则，失败时回退到长度检查。
 */
export function isValidIcon(str: string): boolean {
  if (!str || str.length > 10) {
    return false;
  }

  try {
    const emojiPattern = /[\p{Emoji}]/u;
    return emojiPattern.test(str);
  } catch {
    // 环境不支持 Unicode property escapes 时，回退到长度检查
    return str.length >= 1 && str.length <= 10;
  }
}

// ── 标准化 ──

/**
 * 把 Redis 里可能残缺的原始数据转成完整的 Tenant。
 * 用于 getAllTenants / getSubdomainData 等所有读取路径。
 *
 * 旧记录兼容策略：
 * - 缺 emoji → DEFAULT_EMOJI ('❓')
 * - 缺 createdAt → DEFAULT_CREATED_AT (0)
 * - raw 为 null/undefined → 整条用默认值
 */
export function normalizeTenant(
  subdomain: string,
  raw: TenantRecord | null | undefined
): Tenant {
  return {
    subdomain,
    emoji: raw?.emoji || DEFAULT_EMOJI,
    createdAt: raw?.createdAt ?? DEFAULT_CREATED_AT
  };
}
