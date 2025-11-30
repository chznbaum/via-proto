import { createClient } from '@/libs/supabase/server';
import config from '@/config';

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
};

function generateXml(entries: SitemapEntry[]): string {
  const urlEntries = entries
    .map(
      (entry) => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified.toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export async function GET() {
  const baseUrl = `https://${config.domainName}`;
  const supabase = await createClient();

  // Static pages
  const staticPages: SitemapEntry[] = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Fetch all public learning paths
  const { data: publicPaths, error } = await supabase
    .from('learning_paths')
    .select('id, updated_at')
    .eq('is_public', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching public paths for sitemap:', error);
    const xml = generateXml(staticPages);
    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  // Generate sitemap entries for public paths
  const pathPages: SitemapEntry[] = (publicPaths || []).map((path) => ({
    url: `${baseUrl}/paths/${path.id}`,
    lastModified: new Date(path.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const xml = generateXml([...staticPages, ...pathPages]);

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
