import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers();
  const domain = headersList.get('host') || 'sandhyacollections.manabuy.in';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  
  const baseUrl = `${protocol}://${domain}`;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Category URLs can be added here if we fetch them from the service
  ];
}
