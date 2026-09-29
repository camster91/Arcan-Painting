const PUBLIC_ROUTES = [
  ["/", "1.0", "weekly"],
  ["/interior-painting", "0.9", "monthly"],
  ["/exterior-painting", "0.9", "monthly"],
  ["/commercial-painting", "0.9", "monthly"],
  ["/wallpaper-services", "0.9", "monthly"],
  ["/specialty-finishes", "0.9", "monthly"],
  ["/luxury-painting-gta", "0.9", "monthly"],
  ["/contact", "0.7", "yearly"],
  ["/quote", "0.7", "yearly"],
  ["/privacy", "0.3", "yearly"],
];

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

// Generated location pages remain excluded until service-area facts and unique
// local content are approved. Conversion-completion and private routes are also
// intentionally omitted.
export async function GET() {
  const baseUrl = (process.env.APP_URL || "https://arcanpainting.ca").replace(/\/$/, "");
  const urls = PUBLIC_ROUTES.map(([path, priority, changefreq]) => `  <url>\n    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(sitemap, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
