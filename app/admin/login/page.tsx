import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminPassword, verifySessionToken, SESSION_COOKIE } from '@/lib/auth';
import { LoginForm } from './login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function LoginPage() {
  // If already authenticated, redirect to admin
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && (await verifySessionToken(token))) {
    redirect('/admin');
  }

  const passwordConfigured = !!getAdminPassword();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      {passwordConfigured ? (
        <LoginForm />
      ) : (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-xl text-center">
              Admin Not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              The admin password has not been configured. Set the{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                ADMIN_PASSWORD
              </code>{' '}
              environment variable to enable admin access.
            </p>
          </CardContent>
        </Card>
      )}

      <Link
        href="/"
        className="mt-6 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
