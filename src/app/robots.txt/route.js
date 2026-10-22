// Generate dynamic robots.txt
export async function GET() {
  if (process.env.PUBLIC_SITE_MODE === "staging") {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" },
    });
  }

  const publicRules = `Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*
Disallow: /account/
Disallow: /account/*
Disallow: /thank-you`;
  const robotsTxt = ["*", "Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User"]
    .map((agent) => `User-agent: ${agent}\n${publicRules}`)
    .join("\n\n") + `

# Training remains blocked independently of search discovery.
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
