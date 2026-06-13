import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSubdomainData, resolveTenantDisplay } from '@/lib/subdomains';
import { protocol, rootDomain } from '@/lib/utils';

export async function generateMetadata({
  params
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const subdomainData = await getSubdomainData(subdomain);

  if (!subdomainData) {
    return {
      title: rootDomain
    };
  }

  const display = resolveTenantDisplay(subdomainData, subdomain);

  return {
    title: `${display.name} | ${subdomain}.${rootDomain}`,
    description: display.tagline || display.description
  };
}

export default async function SubdomainPage({
  params
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const subdomainData = await getSubdomainData(subdomain);

  if (!subdomainData) {
    notFound();
  }

  const display = resolveTenantDisplay(subdomainData, subdomain);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="absolute top-4 right-4">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="text-9xl mb-6">{subdomainData.emoji}</div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {display.headline}
          </h1>
          {display.tagline && (
            <p className="mt-3 text-xl text-gray-500 font-medium">
              {display.tagline}
            </p>
          )}
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            {display.description}
          </p>
          <div className="mt-6 text-sm text-gray-400">
            {subdomain}.{rootDomain}
          </div>
        </div>
      </div>
    </div>
  );
}
