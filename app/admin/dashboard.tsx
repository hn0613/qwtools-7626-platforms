'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { deleteSubdomainAction } from '@/app/actions';
import { rootDomain, protocol } from '@/lib/utils';
import { resolveTenantDisplay } from '@/lib/subdomains';

type Tenant = {
  subdomain: string;
  emoji: string;
  createdAt: number;
  name?: string;
  tagline?: string;
  description?: string;
  headline?: string;
};

type DeleteState = {
  error?: string;
  success?: string;
};

function DashboardHeader() {
  // TODO: You can add authentication here with your preferred auth provider

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">Subdomain Management</h1>
      <div className="flex items-center gap-4">
        <Link
          href={`${protocol}://${rootDomain}`}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {rootDomain}
        </Link>
      </div>
    </div>
  );
}

function TenantGrid({
  tenants,
  action,
  isPending
}: {
  tenants: Tenant[];
  action: (formData: FormData) => void;
  isPending: boolean;
}) {
  if (tenants.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">No subdomains have been created yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tenants.map((tenant) => {
        const display = resolveTenantDisplay(tenant, tenant.subdomain);
        return (
          <Card key={tenant.subdomain}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{display.name}</CardTitle>
                <form action={action}>
                  <input
                    type="hidden"
                    name="subdomain"
                    value={tenant.subdomain}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="submit"
                    disabled={isPending}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </Button>
                </form>
              </div>
              <p className="text-xs text-gray-400">{tenant.subdomain}.{rootDomain}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="text-4xl">{tenant.emoji}</div>
                <div className="flex-1 min-w-0">
                  {display.tagline && (
                    <p className="text-sm text-gray-700 truncate">{display.tagline}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {display.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-400">
                  Created: {new Date(tenant.createdAt).toLocaleDateString()}
                </div>
                <a
                  href={`${protocol}://${tenant.subdomain}.${rootDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  Visit →
                </a>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function AdminDashboard({ tenants }: { tenants: Tenant[] }) {
  const [state, action, isPending] = useActionState<DeleteState, FormData>(
    deleteSubdomainAction,
    {}
  );

  return (
    <div className="space-y-6 relative p-4 md:p-8">
      <DashboardHeader />
      <TenantGrid tenants={tenants} action={action} isPending={isPending} />

      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          {state.success}
        </div>
      )}
    </div>
  );
}
