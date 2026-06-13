'use server';

import { redis } from '@/lib/redis';
import { isValidIcon } from '@/lib/subdomains';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { rootDomain, protocol } from '@/lib/utils';

export type CreateState = {
  error?: string;
  subdomain?: string;
  icon?: string;
};

export async function createSubdomainAction(
  _prevState: CreateState,
  formData: FormData
): Promise<CreateState> {
  const subdomain = (formData.get('subdomain') as string)?.trim() ?? '';
  const icon = (formData.get('icon') as string)?.trim() ?? '';

  if (!subdomain) {
    return { error: 'Please enter a subdomain name', subdomain, icon };
  }

  if (!icon) {
    return { error: 'Please select an emoji icon', subdomain, icon };
  }

  if (!isValidIcon(icon)) {
    return {
      error: 'Please select a valid emoji (maximum 10 characters)',
      subdomain,
      icon
    };
  }

  const sanitizedSubdomain = subdomain
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  if (sanitizedSubdomain !== subdomain) {
    return {
      error:
        'Subdomain can only contain lowercase letters, numbers, and hyphens',
      subdomain,
      icon
    };
  }

  const subdomainAlreadyExists = await redis.get(
    `subdomain:${sanitizedSubdomain}`
  );
  if (subdomainAlreadyExists) {
    return {
      error: `The subdomain "${sanitizedSubdomain}" is already taken`,
      subdomain,
      icon
    };
  }

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
  const subdomain = formData.get('subdomain');
  await redis.del(`subdomain:${subdomain}`);
  revalidatePath('/admin');
  return { success: 'Domain deleted successfully' };
}
