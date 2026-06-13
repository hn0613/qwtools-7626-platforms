export type SubdomainData = {
  emoji: string;
  name: string;
  description: string;
  createdAt: number;
};

export type Tenant = SubdomainData & {
  subdomain: string;
};
