import config from '@/config';

export async function GET() {
  const baseUrl = `https://${config.domainName}`;

  const robotsTxt = `# *
User-agent: *
Allow: /

# Host
Host: ${baseUrl}

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      // Cache for 24 hours
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
