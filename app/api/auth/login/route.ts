import { NextResponse } from 'next/server';
import {
  createSessionToken,
  getAdminPassword,
  SESSION_COOKIE,
  SESSION_MAX_AGE
} from '@/lib/auth';

export async function POST(request: Request) {
  const password = getAdminPassword();
  if (!password) {
    return NextResponse.json(
      {
        error:
          'Admin password is not configured. Set the ADMIN_PASSWORD environment variable.'
      },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  if (!body.password || body.password !== password) {
    return NextResponse.json(
      { error: 'Incorrect password' },
      { status: 401 }
    );
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
  return response;
}
