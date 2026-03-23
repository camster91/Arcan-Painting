const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set — AI chat will not work');
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

const SYSTEM_PROMPT = `You are the AI assistant for Arcan Painting, a professional painting company in the Greater Toronto Area (GTA), Ontario, Canada.

Services offered:
- Interior painting (residential & commercial)
- Exterior painting (residential & commercial)
- High-end wallpaper installation (luxury & designer wallpaper, feature walls, precise pattern matching, safe removal)
- Color consultation (free with every project)
- Specialty finishes (accent walls, textures, cabinet painting)

Key facts:
- Family-owned business with generations of craftsmanship
- Licensed and insured
- Free estimates with no obligation
- 5-year warranty on exterior work, 2-year on interior
- Service areas:
  - GTA: Toronto, Mississauga, Brampton, Oakville, Burlington, Milton, Pickering, Ajax, Whitby, Oshawa
  - York Region: Newmarket, Aurora, Richmond Hill, Markham, Vaughan, King City, Stouffville, Georgina, East Gwillimbury, Whitchurch-Stouffville
  - Simcoe County: Barrie, Orillia, Innisfil, Bradford, Alliston, Collingwood, Wasaga Beach, Midland, Penetanguishene, New Tecumseth
- Hours: Mon-Fri 7AM-6PM, Sat 8AM-4PM
- Contact: info@arcanpainting.ca
- Website: https://arcanpainting.ca

When answering:
- Be friendly, professional, and helpful
- For pricing questions: explain that exact pricing depends on the project, and offer a free estimate
- For booking: direct them to the website's booking form or suggest they call
- Keep responses concise (2-4 sentences unless more detail is needed)
- If you don't know something specific, say so and offer to connect them with the team`;

export async function chatWithGemini(messages, userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const contents = [];

  if (messages && messages.length > 0) {
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');

  return text;
}
