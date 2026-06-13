import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyToken, ADMIN_COOKIE } from '@/lib/auth';
import { cookies } from 'next/headers';
import { LoginForm } from './login-form';
import { rootDomain } from '@/lib/utils';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  // Already authenticated — go to admin
  if (token && (await verifyToken(token))) {
    redirect('/admin');
  }

  const configured = !!process.env.ADMIN_PASSWORD;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-gray-600">{rootDomain}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            {!configured ? (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
                Admin access is not configured. Set the{' '}
                <code className="font-mono font-semibold">ADMIN_PASSWORD</code>{' '}
                environment variable to enable login.
              </div>
            ) : (
              <LoginForm />
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
