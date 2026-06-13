'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { generateToken, ADMIN_COOKIE } from '@/lib/auth';

export async function loginAction(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const configured = process.env.ADMIN_PASSWORD;

  if (!configured) {
    return {
      error: 'Admin access is not configured. Set the ADMIN_PASSWORD environment variable.'
    };
  }

  if (password !== configured) {
    return { error: 'Invalid password' };
  }

  const token = await generateToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  redirect('/admin');
}
