/**
 * Gemini Flash vision utility for analyzing painting project images.
 * Used by admin gallery API for on-demand image tagging.
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

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

  const imagePart = base64
    ? { inline_data: { mime_type: "image/webp", data: base64 } }
    : { file_data: { file_uri: url, mime_type: "image/webp" } };

  // If URL provided and not base64, fetch and convert
  let finalImagePart = imagePart;
  if (url && !base64) {
    try {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      const b64 = Buffer.from(buffer).toString("base64");
      finalImagePart = { inline_data: { mime_type: "image/webp", data: b64 } };
    } catch {
      // Fall back to basic tags if fetch fails
      return getFallbackTags();
    }
  }

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
