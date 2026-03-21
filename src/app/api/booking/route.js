import { getCalendarClient } from "@/lib/google.js";
import { sendGmailEmail } from "@/lib/google.js";
import { createRateLimiter } from "../utils/rate-limit.js";

const bookingLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 5,
  prefix: "booking",
});

/**
 * POST /api/booking
 * Creates a Google Calendar event for a booking and sends a confirmation email.
 * Body: { name, email, phone, service, date, time }
 */
export async function POST(request) {
  const limited = bookingLimiter(request);
  if (limited) return limited;

  try {
    const body = await request.json();

    const required = ["name", "email", "phone", "service", "date", "time"];
    for (const field of required) {
      if (!body[field] || String(body[field]).trim() === "") {
        return Response.json(
          { error: `${field} is required` },
          { status: 400 },
        );
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Parse date + time into start/end (1-hour default duration)
    const startDateTime = new Date(`${body.date}T${body.time}`);
    if (isNaN(startDateTime.getTime())) {
      return Response.json(
        { error: "Invalid date or time format. Use date: YYYY-MM-DD, time: HH:MM" },
        { status: 400 },
      );
    }
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    // Create Google Calendar event
    const calendar = getCalendarClient();
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `Arcan Painting — ${body.service}`,
        description: `Client: ${body.name}\nEmail: ${body.email}\nPhone: ${body.phone}\nService: ${body.service}`,
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
        attendees: [{ email: body.email }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    });

    // Send confirmation email to the customer
    try {
      await sendGmailEmail({
        to: body.email,
        subject: "Booking Confirmed — Arcan Painting",
        body: `<p>Hi ${body.name},</p>
<p>Your booking has been confirmed!</p>
<ul>
  <li><strong>Service:</strong> ${body.service}</li>
  <li><strong>Date:</strong> ${body.date}</li>
  <li><strong>Time:</strong> ${body.time}</li>
</ul>
<p>We look forward to working with you. If you need to reschedule, please contact us.</p>
<p>Best regards,<br>The Arcan Painting Team</p>`,
      });
    } catch (emailError) {
      console.error("Booking confirmation email failed:", emailError.message);
      // Don't fail the request — event was already created
    }

    return Response.json({
      success: true,
      message: "Booking confirmed! Check your email for details.",
      eventId: event.data.id,
    });
  } catch (error) {
    console.error("Booking error:", error.message);

    if (error.message?.includes("Missing Google OAuth")) {
      return Response.json(
        { error: "Booking service is not configured" },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Failed to create booking. Please try again or contact us directly." },
      { status: 500 },
    );
  }
}
