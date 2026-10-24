// Generate dynamic robots.txt
export async function GET() {
  if (process.env.PUBLIC_SITE_MODE === "staging") {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /account/
Disallow: /crew/
Disallow: /e/
Disallow: /i/
Disallow: /uploads/
Disallow: /thank-you
Disallow: /design-system

User-agent: GPTBot
Disallow: /

Sitemap: https://arcanpainting.ca/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
