// Generate dynamic robots.txt
export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Disallow: /account/
Disallow: /account/*

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://arcanpainting.ca/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
