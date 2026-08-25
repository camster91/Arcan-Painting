/**
 * Gemini Flash vision utility for analyzing painting project images.
 * Used by admin gallery API for on-demand image tagging.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class ImageInputError extends Error {}

const PROMPT = `Analyze this painting project photo and return ONLY valid JSON (no markdown, no code blocks):
{
  "category": "interior|exterior|commercial",
  "room": "kitchen|bedroom|bathroom|living_room|hallway|staircase|office|facade|deck|garage|basement|dining_room|laundry|closet|foyer|porch|shed|other",
  "service": "wall_painting|cabinet_refinishing|trim_work|ceiling|deck_staining|accent_wall|full_room|exterior_siding|door_painting|railing|floor_painting|drywall_repair|other",
  "phase": "before|during|after|detail",
  "quality_score": 0.0 to 1.0,
  "title": "A descriptive title like: Modern Kitchen with Fresh White Cabinets",
  "alt_text": "SEO alt text describing the image for accessibility",
  "orientation": "normal|rotated_90|rotated_180|rotated_270"
}`;

/**
 * Analyze an image using Gemini Flash vision.
 * @param {{ url?: string, base64?: string }} input - Image as URL or base64
 * @returns {Promise<object>} Structured tags
 */
export async function analyzeImage({ url, base64 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const finalImagePart = await toInlineImagePart({ url, base64 });

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: PROMPT }, finalImagePart]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 },
      }),
    });

    if (!res.ok) {
      console.error(`Gemini API error: ${res.status}`);
      return getFallbackTags();
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return getFallbackTags();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return getFallbackTags();

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Vision tagger error:", err.message);
    return getFallbackTags();
  }
}

export function getTrustedGalleryImageUrl(url) {
  const configuredOrigin = process.env.PUBLIC_APP_URL || process.env.APP_URL;
  if (!configuredOrigin) {
    throw new ImageInputError("Gallery image URL imports require PUBLIC_APP_URL or APP_URL");
  }

  let appOrigin;
  let imageUrl;
  try {
    appOrigin = new URL(configuredOrigin).origin;
    imageUrl = new URL(url);
  } catch {
    throw new ImageInputError("Gallery image URL is invalid");
  }

  if (imageUrl.origin !== appOrigin || !imageUrl.pathname.startsWith("/gallery/")) {
    throw new ImageInputError("Only images hosted in this site's /gallery/ path can be analyzed by URL");
  }
  if (!/\.(?:jpe?g|png|webp)$/i.test(imageUrl.pathname)) {
    throw new ImageInputError("Gallery image URL must reference a JPEG, PNG, or WebP image");
  }

  return imageUrl;
}

function inlinePartFromBase64(base64, mimeType = "image/webp") {
  if (typeof base64 !== "string" || base64.length === 0 || base64.length > MAX_BASE64_LENGTH) {
    throw new ImageInputError("Image must be a non-empty file smaller than 5 MB");
  }
  if (base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new ImageInputError("Image data is not valid base64");
  }
  if (Buffer.from(base64, "base64").length > MAX_IMAGE_BYTES) {
    throw new ImageInputError("Image must be smaller than 5 MB");
  }
  return { inline_data: { mime_type: mimeType, data: base64 } };
}

async function toInlineImagePart({ url, base64 }) {
  if (base64) return inlinePartFromBase64(base64);
  if (!url) throw new ImageInputError("An image URL or base64 image is required");

  const imageUrl = getTrustedGalleryImageUrl(url);
  let res;
  try {
    res = await fetch(imageUrl, { redirect: "error", signal: AbortSignal.timeout(5_000) });
  } catch {
    throw new ImageInputError("Unable to retrieve the gallery image");
  }
  if (!res.ok) throw new ImageInputError("Gallery image could not be retrieved");

  const contentType = (res.headers.get("content-type") || "").split(";", 1)[0].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new ImageInputError("Gallery image must be a JPEG, PNG, or WebP file");
  }
  const contentLength = Number(res.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
    throw new ImageInputError("Gallery image must be smaller than 5 MB");
  }

  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageInputError("Gallery image must be smaller than 5 MB");
  }
  return inlinePartFromBase64(Buffer.from(buffer).toString("base64"), contentType);
}

function getFallbackTags() {
  return {
    category: "interior",
    room: "other",
    service: "wall_painting",
    phase: "after",
    quality_score: 0.5,
    title: "Painting Project",
    alt_text: "Professional painting project by Arcan Painting",
    orientation: "normal",
  };
}
