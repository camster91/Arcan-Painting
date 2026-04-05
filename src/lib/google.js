/**
 * Google services via Maton.ai gateway.
 * Replaces direct googleapis OAuth with Maton API key-based gateway calls.
 */

const MATON_GATEWAY = "https://gateway.maton.ai";

function getMatonKey() {
  const key = process.env.MATON_API_KEY;
  if (!key) {
    throw new Error(
      "Missing Maton API key. Set MATON_API_KEY in your project secrets.",
    );
  }
  return key;
}

function matonHeaders() {
  return {
    Authorization: `Bearer ${getMatonKey()}`,
    "Content-Type": "application/json",
  };
}

/**
 * Sends an email via Maton → Gmail API using the raw RFC 2822 format.
 * @param {{ to: string, subject: string, body: string, replyTo?: string }} opts
 */
export async function sendGmailEmail({ to, subject, body, replyTo }) {
  const fromEmail = process.env.GOOGLE_EMAIL || "info@arcanpainting.ca";

  const headers = [
    `From: Arcan Painting <${fromEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset="UTF-8"`,
  ];
  if (replyTo) {
    headers.push(`Reply-To: ${replyTo}`);
  }

  const rawMessage = [...headers, "", body].join("\r\n");

  const encoded = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch(
    `${MATON_GATEWAY}/google-mail/gmail/v1/users/me/messages/send`,
    {
      method: "POST",
      headers: matonHeaders(),
      body: JSON.stringify({ raw: encoded }),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Gmail send failed: ${err?.error?.message || response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Returns a calendar-like object that mimics the googleapis calendar interface,
 * backed by Maton gateway.
 */
export function getCalendarClient() {
  return {
    events: {
      async insert({ calendarId, requestBody }) {
        const cid = calendarId || "primary";
        const response = await fetch(
          `${MATON_GATEWAY}/google-calendar/calendar/v3/calendars/${cid}/events`,
          {
            method: "POST",
            headers: matonHeaders(),
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            `Calendar insert failed: ${err?.error?.message || response.statusText}`,
          );
        }

        const data = await response.json();
        return { data };
      },

      async list({ calendarId, timeMin, timeMax, maxResults, singleEvents, orderBy }) {
        const cid = calendarId || "primary";
        const params = new URLSearchParams();
        if (timeMin) params.set("timeMin", timeMin);
        if (timeMax) params.set("timeMax", timeMax);
        if (maxResults) params.set("maxResults", String(maxResults));
        if (singleEvents != null) params.set("singleEvents", String(singleEvents));
        if (orderBy) params.set("orderBy", orderBy);

        const response = await fetch(
          `${MATON_GATEWAY}/google-calendar/calendar/v3/calendars/${cid}/events?${params}`,
          { headers: matonHeaders() },
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            `Calendar list failed: ${err?.error?.message || response.statusText}`,
          );
        }

        const data = await response.json();
        return { data };
      },
    },
  };
}

/**
 * @deprecated No longer needed — Maton handles auth. Kept for compatibility.
 */
export function getGoogleOAuth2Client() {
  return null;
}

/**
 * @deprecated Use sendGmailEmail directly. Kept for compatibility.
 */
export function getGmailClient() {
  return {
    users: {
      messages: {
        async send({ userId, requestBody }) {
          const response = await fetch(
            `${MATON_GATEWAY}/google-mail/gmail/v1/users/me/messages/send`,
            {
              method: "POST",
              headers: matonHeaders(),
              body: JSON.stringify(requestBody),
            },
          );

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(
              `Gmail send failed: ${err?.error?.message || response.statusText}`,
            );
          }

          const data = await response.json();
          return { data };
        },
      },
    },
  };
}
