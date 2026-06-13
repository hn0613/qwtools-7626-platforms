'use server';

import { redis } from '@/lib/redis';
import {
  isValidIcon,
  validateTextField,
  TENANT_FIELD_LIMITS
} from '@/lib/subdomains';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { rootDomain, protocol } from '@/lib/utils';

type CreateState = {
  success: boolean;
  error?: string;
  subdomain?: string;
  icon?: string;
  name?: string;
  tagline?: string;
  description?: string;
  headline?: string;
};

/**
 * Preserves the raw form values on failure so the user does not have to
 * re-enter everything after a validation error.
 */
function preserveValues(
  overrides: Partial<CreateState> & { error: string }
): CreateState {
  return { success: false, ...overrides };
}

export async function createSubdomainAction(
  prevState: any,
  formData: FormData
): Promise<CreateState> {
  const subdomain = formData.get('subdomain') as string;
  const icon = formData.get('icon') as string;
  const rawName = formData.get('name');
  const rawTagline = formData.get('tagline');
  const rawDescription = formData.get('description');
  const rawHeadline = formData.get('headline');

  // Keep raw strings for round-tripping into the form on error.
  const formSnapshot = {
    subdomain,
    icon,
    name: typeof rawName === 'string' ? rawName : '',
    tagline: typeof rawTagline === 'string' ? rawTagline : '',
    description: typeof rawDescription === 'string' ? rawDescription : '',
    headline: typeof rawHeadline === 'string' ? rawHeadline : ''
  };

  if (!subdomain || !icon) {
    return preserveValues({
      ...formSnapshot,
      error: 'Subdomain and icon are required'
    });
  }

  if (!isValidIcon(icon)) {
    return preserveValues({
      ...formSnapshot,
      error: 'Please enter a valid emoji (maximum 10 characters)'
    });
  }

  // --- Validate brand fields -------------------------------------------
  const nameCheck = validateTextField(rawName, {
    fieldName: 'Name',
    ...TENANT_FIELD_LIMITS.name
  });
  if (!nameCheck.valid) {
    return preserveValues({ ...formSnapshot, error: nameCheck.error! });
  }

  const taglineCheck = validateTextField(rawTagline, {
    fieldName: 'Tagline',
    ...TENANT_FIELD_LIMITS.tagline
  });
  if (!taglineCheck.valid) {
    return preserveValues({ ...formSnapshot, error: taglineCheck.error! });
  }

  const descriptionCheck = validateTextField(rawDescription, {
    fieldName: 'Description',
    ...TENANT_FIELD_LIMITS.description
  });
  if (!descriptionCheck.valid) {
    return preserveValues({ ...formSnapshot, error: descriptionCheck.error! });
  }

  const headlineCheck = validateTextField(rawHeadline, {
    fieldName: 'Headline',
    ...TENANT_FIELD_LIMITS.headline
  });
  if (!headlineCheck.valid) {
    return preserveValues({ ...formSnapshot, error: headlineCheck.error! });
  }

  // --- Sanitise subdomain ----------------------------------------------
  const sanitizedSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (sanitizedSubdomain !== subdomain) {
    return preserveValues({
      ...formSnapshot,
      error:
        'Subdomain can only have lowercase letters, numbers, and hyphens. Please try again.'
    });
  }

  const subdomainAlreadyExists = await redis.get(
    `subdomain:${sanitizedSubdomain}`
  );
  if (subdomainAlreadyExists) {
    return preserveValues({
      ...formSnapshot,
      error: 'This subdomain is already taken'
    });
  }

  // --- Persist ---------------------------------------------------------
  await redis.set(`subdomain:${sanitizedSubdomain}`, {
    emoji: icon,
    createdAt: Date.now(),
    name: nameCheck.value,
    tagline: taglineCheck.value || undefined,
    description: descriptionCheck.value || undefined,
    headline: headlineCheck.value || undefined
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
