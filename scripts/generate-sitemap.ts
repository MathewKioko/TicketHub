// scripts/generate-sitemap.ts
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SITE_URL = 'https://tickethubke.app';

async function generateSitemap() {
  // Fetch all events from your database
  const events = await prisma.event.findMany({
    select: { id: true, slug: true, updatedAt: true },
  });

  const pages = [
    { url: '', lastmod: new Date() },
    { url: 'events', lastmod: new Date() },
    { url: 'auth/login', lastmod: new Date() },
    { url: 'auth/signup', lastmod: new Date() },
    { url: 'become-organizer', lastmod: new Date() },
    // add more static pages if needed
  ];

  const eventPages = events.map((e) => ({
    url: `events/${e.slug || e.id}`,
    lastmod: e.updatedAt,
  }));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages, ...eventPages]
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}/${page.url}</loc>
    <lastmod>${page.lastmod.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  // Save to project root so Vercel serves it automatically
  fs.writeFileSync(path.join(process.cwd(), 'sitemap.xml'), sitemap);
  console.log('✅ sitemap.xml generated at project root!');
}

generateSitemap()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
