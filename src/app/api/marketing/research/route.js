import { getCurrentUser } from "../../utils/auth.js";
import sql from "../../utils/sql.js";

// GET - list research results
export async function GET(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "all";
  const limit = parseInt(url.searchParams.get("limit") || "20");

  let query = "SELECT * FROM content_research WHERE (expires_at IS NULL OR expires_at > NOW())";
  const params = [];
  if (type !== "all") {
    query += ` AND research_type = $${params.length + 1}`;
    params.push(type);
  }
  query += ` ORDER BY relevance_score DESC, created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const research = await sql(query, params);
  return Response.json({ research });
}

// POST - run a research job
export async function POST(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action, topic, researchType, researchId } = body;
  const geminiKey = process.env.GEMINI_API_KEY;
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;

  if (action === "research_topic") {
    // Research a specific topic using Brave Search + AI synthesis
    let searchResults = [];

    if (braveKey) {
      try {
        const query =
          topic ||
          `painting trends Toronto 2025 ${new Date().toLocaleDateString("en-CA", { month: "long", year: "numeric" })}`;
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=CA`,
          { headers: { Accept: "application/json", "X-Subscription-Token": braveKey } }
        );
        if (res.ok) {
          const data = await res.json();
          searchResults = (data.web?.results || []).map((r) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          }));
        }
      } catch (e) {
        console.error("[research] Brave search error:", e.message);
      }
    }

    // AI synthesis
    let contentIdeas = [];
    if (geminiKey) {
      const contextStr =
        searchResults.length > 0
          ? searchResults.map((r, i) => `${i + 1}. ${r.title}\n${r.description}`).join("\n\n")
          : `Topic: ${topic}`;

      const prompt = `You are a content strategist for Arcan Painting, a professional painting company in the Greater Toronto Area.

Research context:
${contextStr}

Based on this, generate 5 specific content ideas for Arcan Painting's social media and marketing.
Each idea should be:
- Relevant to the Toronto/GTA market
- Tied to painting services (interior, exterior, commercial, cabinet)
- Actionable (can be turned into a post today)

Return ONLY a JSON array of 5 objects:
[
  {
    "title": "Short catchy title",
    "platform": "instagram|facebook|google_business|blog|email",
    "angle": "The specific angle or hook",
    "outline": "2-3 sentence content outline",
    "hashtags": ["relevant", "hashtags"]
  }
]`;

      try {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            contentIdeas = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error("[research] AI synthesis error:", e.message);
      }
    }

    // Save research results to DB
    const saved = [];
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks

    // Save each search result as a research entry
    for (const result of searchResults) {
      const rows = await sql`
        INSERT INTO content_research (research_type, title, summary, source_url, source_name, relevance_score, content_ideas, tags, expires_at)
        VALUES (${researchType || "trending"}, ${result.title}, ${result.description}, ${result.url}, ${"brave_search"}, ${5}, ${JSON.stringify(contentIdeas)}, ${JSON.stringify([topic])}, ${expiresAt})
        RETURNING *
      `;
      saved.push(rows[0]);
    }

    // If no search results but we have AI ideas, save a synthetic entry
    if (searchResults.length === 0 && contentIdeas.length > 0) {
      const rows = await sql`
        INSERT INTO content_research (research_type, title, summary, source_url, source_name, relevance_score, content_ideas, tags, expires_at)
        VALUES (${researchType || "trending"}, ${`AI Research: ${topic}`}, ${"AI-generated content ideas based on topic research"}, ${null}, ${"ai_synthesis"}, ${7}, ${JSON.stringify(contentIdeas)}, ${JSON.stringify([topic])}, ${expiresAt})
        RETURNING *
      `;
      saved.push(rows[0]);
    }

    return Response.json({ research: saved, contentIdeas, searchResults });
  }

  if (action === "seasonal_scan") {
    // Generate seasonal content ideas based on current month
    const month = new Date().toLocaleDateString("en-CA", { month: "long" });
    const season = getSeasonForMonth(new Date().getMonth());

    let ideas = [];
    if (geminiKey) {
      const prompt = `You are a content strategist for Arcan Painting in Toronto, Canada.
It is currently ${month} (${season}).

Generate 5 seasonal content ideas for a painting company that are timely RIGHT NOW.
Consider: weather, holidays, home improvement trends, real estate seasons, and local Toronto events.

Return ONLY a JSON array of 5 objects:
[
  {
    "title": "Short catchy title",
    "platform": "instagram|facebook|google_business|blog|email",
    "angle": "The seasonal hook",
    "outline": "2-3 sentence content outline",
    "urgency": "why this is relevant right now"
  }
]`;

      try {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            ideas = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error("[research] Seasonal scan error:", e.message);
      }
    }

    // Save seasonal research
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month
    const rows = await sql`
      INSERT INTO content_research (research_type, title, summary, relevance_score, content_ideas, tags, expires_at)
      VALUES ('seasonal', ${`${month} ${season} Content Ideas`}, ${`Seasonal content strategy for ${month}`}, ${8}, ${JSON.stringify(ideas)}, ${JSON.stringify([season, month.toLowerCase()])}, ${expiresAt})
      RETURNING *
    `;

    return Response.json({ research: rows[0], ideas });
  }

  if (action === "competitor_scan") {
    // Research competitor content strategies
    let searchResults = [];
    if (braveKey) {
      try {
        const query = topic || "painting company Toronto social media marketing content";
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&country=CA`,
          { headers: { Accept: "application/json", "X-Subscription-Token": braveKey } }
        );
        if (res.ok) {
          const data = await res.json();
          searchResults = (data.web?.results || []).map((r) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          }));
        }
      } catch (e) {
        console.error("[research] Competitor scan error:", e.message);
      }
    }

    let analysis = [];
    if (geminiKey && searchResults.length > 0) {
      const prompt = `You are a competitive analyst for Arcan Painting in Toronto.

Competitor content found online:
${searchResults.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.description}`).join("\n\n")}

Analyze these competitor content strategies and suggest 5 ways Arcan Painting can differentiate or improve.

Return ONLY a JSON array of 5 objects:
[
  {
    "insight": "What the competitor is doing",
    "opportunity": "How Arcan Painting can do it better",
    "content_idea": "A specific post or content piece to create",
    "platform": "best platform for this"
  }
]`;

      try {
        const aiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error("[research] Competitor analysis error:", e.message);
      }
    }

    // Save competitor research
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week
    const rows = await sql`
      INSERT INTO content_research (research_type, title, summary, relevance_score, content_ideas, tags, expires_at)
      VALUES ('competitor', ${`Competitor Analysis: ${topic || "GTA Painting"}`}, ${`Competitive content analysis with ${searchResults.length} sources`}, ${7}, ${JSON.stringify(analysis)}, ${JSON.stringify(["competitor", "analysis"])}, ${expiresAt})
      RETURNING *
    `;

    return Response.json({ research: rows[0], analysis, sources: searchResults });
  }

  if (action === "mark_used") {
    // Increment used_count for a research item
    if (!researchId) return Response.json({ error: "researchId required" }, { status: 400 });

    const rows = await sql`
      UPDATE content_research SET used_count = used_count + 1 WHERE id = ${researchId} RETURNING *
    `;
    if (!rows.length) return Response.json({ error: "Research not found" }, { status: 404 });
    return Response.json({ research: rows[0] });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE - remove expired or specific research
export async function DELETE(request) {
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    await sql`DELETE FROM content_research WHERE id = ${parseInt(id)}`;
    return Response.json({ success: true });
  }

  // Clean up expired research
  const deleted = await sql`DELETE FROM content_research WHERE expires_at < NOW() RETURNING id`;
  return Response.json({ success: true, deletedCount: deleted.length });
}

// Helper: map month index to season
function getSeasonForMonth(monthIndex) {
  if (monthIndex >= 2 && monthIndex <= 4) return "spring";
  if (monthIndex >= 5 && monthIndex <= 7) return "summer";
  if (monthIndex >= 8 && monthIndex <= 10) return "fall";
  return "winter";
}
