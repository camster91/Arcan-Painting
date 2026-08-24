import { CITY_SLUGS, SERVICE_SLUGS } from "../[service]/[city]/page";

// Generate dynamic sitemap.xml — blog index + posts removed 2026-06-14.
export async function GET() {
  const baseUrl = process.env.APP_URL || "https://arcanpainting.ca";
  const currentDate = new Date().toISOString().split("T")[0];

  const services = Object.keys(SERVICE_SLUGS);

  // The route data is the only source of valid city/service combinations.
  const cityServiceUrls = services.flatMap((service) =>
    CITY_SLUGS.map((city) => `
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
  <!-- City × service SEO pages -->${cityServiceUrls}

</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
