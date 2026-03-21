import { getCalendarClient } from "@/lib/google.js";
import { createRateLimiter } from "../utils/rate-limit.js";

const calendarLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  prefix: "calendar",
});

/**
 * GET /api/calendar
 * Returns upcoming calendar events for the business Google Calendar.
 * Query params:
 *   - maxResults (default 10, max 50)
 *   - days (default 14) — how many days ahead to look
 */
export async function GET(request) {
  const limited = calendarLimiter(request);
  if (limited) return limited;

  try {
    const url = new URL(request.url);
    const maxResults = Math.min(
      parseInt(url.searchParams.get("maxResults") || "10", 10),
      50,
    );
    const days = Math.min(
      parseInt(url.searchParams.get("days") || "14", 10),
      90,
    );

    const calendar = getCalendarClient();
    const now = new Date();
    const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id,
      summary: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || null,
      status: event.status,
    }));

    return Response.json({ events });
  } catch (error) {
    console.error("Calendar fetch error:", error.message);

    if (error.message?.includes("Missing Google OAuth")) {
      return Response.json(
        { error: "Google Calendar is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 },
    );
  }
}
