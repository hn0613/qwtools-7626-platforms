'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { rootDomain, protocol } from '@/lib/utils';

export default function NotFound() {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    const rootDomainFormatted = rootDomain.split(':')[0];

    // 本地开发: tenant.localhost
    if (hostname.endsWith('.localhost')) {
      setSubdomain(hostname.split('.')[0]);
      return;
    }

    // 正式 / 预览环境: tenant.rootdomain.com
    if (
      hostname !== rootDomainFormatted &&
      hostname.endsWith(`.${rootDomainFormatted}`)
    ) {
      setSubdomain(hostname.slice(0, -(rootDomainFormatted.length + 1)));
      return;
    }

    setSubdomain(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          {subdomain ? (
            <>
              <span className="text-blue-600">{subdomain}</span>.{rootDomain}{' '}
              doesn't exist
            </>
          ) : (
            'Subdomain Not Found'
          )}
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          This subdomain hasn't been created yet.
        </p>
        <div className="mt-6">
          <Link
            href={`${protocol}://${rootDomain}`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {subdomain ? `Create ${subdomain}` : `Go to ${rootDomain}`}
          </Link>
        </div>
      </div>
    </div>
  );
}
