// Generate dynamic robots.txt
export async function GET() {
  const baseUrl = process.env.APP_URL || "https://arcanpainting.ca";

  const robotsTxt = `User-agent: *
Allow: /
Allow: /thank-you
Allow: /interior-painting
Allow: /exterior-painting
Allow: /commercial-painting

# Block admin areas from search engines
Disallow: /admin/
Disallow: /api/
Disallow: /account/

# Allow specific crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
