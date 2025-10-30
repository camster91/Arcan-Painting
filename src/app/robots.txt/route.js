// Generate dynamic robots.txt
export async function GET() {
  const baseUrl = process.env.APP_URL || "https://arcanpainting.ca";

  const robotsTxt = `User-agent: *
Allow: /
Allow: /thank-you
Allow: /#services
Allow: /#portfolio  
Allow: /#about
Allow: /#contact

# Block admin areas from search engines
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Disallow: /account/
Disallow: /account/*
Disallow: /_next/
Disallow: /static/

# Block specific files
Disallow: *.json$
Disallow: /favicon.ico

# Allow specific crawlers better access
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay for non-major search engines
User-agent: *
Crawl-delay: 1`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400", // 24 hours
    },
  });
}
