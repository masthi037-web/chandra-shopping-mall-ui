import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const domain = headersList.get('host') || 'sandhyacollections.manabuy.in';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: `${protocol}://${domain}/sitemap.xml`,
  };
}
