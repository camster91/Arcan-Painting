const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set — AI chat will not work');
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';

const SYSTEM_PROMPT = `You are the website assistant for Arcan Painting.

Be friendly, professional, and concise. Help visitors describe their project and direct them to the website contact or booking forms when a team response is needed.

Accuracy rules:
- Do not state or imply service areas, business history, licensing, insurance, warranties, prices, turnaround times, availability, materials, staffing, or project outcomes unless the visitor provides the information in the conversation.
- Do not promise a free estimate, a site visit, or a response deadline.
- For questions that need a business-specific answer, say that a team member can confirm it after reviewing the project details.
- For price questions, explain that pricing depends on the project and invite the visitor to submit their details for review.
- Keep responses to 2-4 sentences unless more detail is needed.
`;
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
