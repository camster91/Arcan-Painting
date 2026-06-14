// Generate dynamic sitemap.xml — blog index + posts removed 2026-06-14.
export async function GET() {
  const baseUrl = process.env.APP_URL || "https://arcanpainting.ca";
  const currentDate = new Date().toISOString().split("T")[0];

  const services = [
    "interior-painting",
    "exterior-painting",
    "commercial-painting",
    "wallpaper-services",
    "specialty-finishes",
  ];

  const cities = [
    // GTA
    "toronto", "mississauga", "brampton", "oakville", "burlington",
    "milton", "pickering", "ajax", "whitby", "oshawa",
    // York Region
    "newmarket", "aurora", "richmond-hill", "markham", "vaughan",
    "king-city", "stouffville", "georgina", "east-gwillimbury",
    // Simcoe County
    "barrie", "orillia", "innisfil", "bradford", "alliston",
    "collingwood", "wasaga-beach", "midland", "penetanguishene",
  ];

  // Generate all 150 city × service combinations
  const cityServiceUrls = services.flatMap((service) =>
    cities.map((city) => `
  <url>
    <loc>${baseUrl}/${service}/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
  ).join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/og-image.png</image:loc>
      <image:caption>Arcan Painting Professional Toronto Painting Services</image:caption>
      <image:title>Professional Painting Services GTA</image:title>
    </image:image>
  </url>

  <!-- Core Service Pages -->
  <url>
    <loc>${baseUrl}/interior-painting</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/exterior-painting</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/commercial-painting</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/wallpaper-services</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>${baseUrl}/specialty-finishes</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Thank You Page -->
  <url>
    <loc>${baseUrl}/thank-you</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <!-- 150 City × Service SEO Pages -->${cityServiceUrls}

</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
