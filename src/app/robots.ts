import { MetadataRoute } from 'next';

const BASE_URL = 'https://www.example.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/en', '/en/project', '/project'],
    },
    host: BASE_URL,
    sitemap: BASE_URL + '/sitemap.xml',
  };
}
