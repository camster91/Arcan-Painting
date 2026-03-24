#!/usr/bin/env node
/**
 * One-time script to analyze gallery images with Gemini Flash vision API.
 *
 * Usage:
 *   GEMINI_API_KEY=AIzaSy... node scripts/tag-gallery-images.mjs
 *
 * Outputs: src/data/gallery-tags.json
 * Supports resumption — skips already-tagged images on re-run.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const IMAGES_DIR = join(ROOT, "public/gallery/images");
const OUTPUT_FILE = join(ROOT, "src/data/gallery-tags.json");
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is required.");
  console.error("Usage: GEMINI_API_KEY=your_key node scripts/tag-gallery-images.mjs");
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT = `Analyze this painting project photo and return ONLY valid JSON (no markdown, no code blocks):
{
  "category": "interior|exterior|commercial",
  "room": "kitchen|bedroom|bathroom|living_room|hallway|staircase|office|facade|deck|garage|basement|dining_room|laundry|closet|foyer|porch|shed|other",
  "service": "wall_painting|cabinet_refinishing|trim_work|ceiling|deck_staining|accent_wall|full_room|exterior_siding|door_painting|railing|floor_painting|drywall_repair|other",
  "phase": "before|during|after|detail",
  "quality_score": 0.0 to 1.0 (how good is this as a portfolio photo? consider composition, lighting, showcases work well),
  "title": "A descriptive title like: Modern Kitchen with Fresh White Cabinets",
  "alt_text": "SEO alt text describing the image for accessibility, mention painting/colors visible",
  "orientation": "normal|rotated_90|rotated_180|rotated_270"
}

This is from a residential/commercial painting company portfolio. Focus on what painting work is visible.`;

async function analyzeImage(filename) {
  const filepath = join(IMAGES_DIR, filename);
  const imageData = readFileSync(filepath).toString("base64");

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: "image/webp", data: imageData } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 500,
    }
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in Gemini response");

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Could not parse JSON from: ${text}`);

  return JSON.parse(jsonMatch[0]);
}

async function main() {
  // Load existing progress
  let tags = {};
  if (existsSync(OUTPUT_FILE)) {
    try {
      tags = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
      console.log(`Loaded ${Object.keys(tags).length} existing tags`);
    } catch {
      console.log("Could not parse existing tags file, starting fresh");
    }
  }

  const files = readdirSync(IMAGES_DIR).filter(f => f.endsWith(".webp")).sort();
  const todo = files.filter(f => !tags[f]);
  console.log(`${files.length} total images, ${todo.length} to process`);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(", ")}`);

    const results = await Promise.allSettled(
      batch.map(async (file) => {
        try {
          const result = await analyzeImage(file);
          console.log(`  ✓ ${file}: ${result.title}`);
          return { file, result };
        } catch (err) {
          console.error(`  ✗ ${file}: ${err.message}`);
          return { file, result: null };
        }
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.result) {
        tags[r.value.file] = r.value.result;
      }
    }

    // Save progress after each batch
    writeFileSync(OUTPUT_FILE, JSON.stringify(tags, null, 2));
    console.log(`  Saved progress (${Object.keys(tags).length}/${files.length})`);

    // Rate limit between batches
    if (i + BATCH_SIZE < todo.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(`\nDone! ${Object.keys(tags).length}/${files.length} images tagged.`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
