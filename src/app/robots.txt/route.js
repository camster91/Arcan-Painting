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
Disallow: /admin/*
Disallow: /api/*
Disallow: /account/
Disallow: /account/*
Disallow: /thank-you

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# OpenAI search discovery is allowed independently of model-training crawl.
User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

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
