'use server';

import { redis } from '@/lib/redis';
import {
  sanitizeSubdomain,
  validateSubdomain,
  isValidIcon
} from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { rootDomain, protocol } from '@/lib/utils';

export async function createSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain') as string;
  const icon = formData.get('icon') as string;

  // 1. 基本非空检查
  if (!subdomain || !icon) {
    return { success: false, error: 'Subdomain and icon are required' };
  }

  // 2. emoji 校验（共用 isValidIcon）
  if (!isValidIcon(icon)) {
    return {
      subdomain,
      icon,
      success: false,
      error: 'Please enter a valid emoji (maximum 10 characters)'
    };
  }

  // 3. 清洗 + 比对（保持现有行为：拒绝不干净的输入）
  const sanitizedSubdomain = sanitizeSubdomain(subdomain);

  if (sanitizedSubdomain !== subdomain) {
    return {
      subdomain,
      icon,
      success: false,
      error:
        'Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.'
    };
  }

  // 4. 长度 + 保留名等规则（新增安全边界）
  const validationError = validateSubdomain(sanitizedSubdomain);
  if (validationError) {
    return {
      subdomain,
      icon,
      success: false,
      error: validationError
    };
  }

  // 5. 唯一性检查
  const subdomainAlreadyExists = await redis.get(
    `subdomain:${sanitizedSubdomain}`
  );
  if (subdomainAlreadyExists) {
    return {
      subdomain,
      icon,
      success: false,
      error: 'This subdomain is already taken'
    };
  }

  // 6. 写入（数据结构不变，兼容旧记录）
  await redis.set(`subdomain:${sanitizedSubdomain}`, {
    emoji: icon,
    createdAt: Date.now()
  });

  redirect(`${protocol}://${sanitizedSubdomain}.${rootDomain}`);
}

export async function deleteSubdomainAction(
  prevState: any,
  formData: FormData
) {
  const subdomain = formData.get('subdomain') as string;

  // 清洗输入，防止未经处理的值直接传给 redis.del
  const sanitized = sanitizeSubdomain(subdomain || '');
  if (!sanitized) {
    return { error: 'Invalid subdomain' };
  }

  await redis.del(`subdomain:${sanitized}`);
  revalidatePath('/admin');
  return { success: 'Domain deleted successfully' };
}
