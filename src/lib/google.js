import { google } from "googleapis";

let _oauth2Client = null;

/**
 * Returns a singleton OAuth2 client configured with credentials from env vars.
 * Automatically sets and refreshes the access token on first use.
 */
export function getGoogleOAuth2Client() {
  if (_oauth2Client) return _oauth2Client;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.",
    );
  }

  _oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  _oauth2Client.setCredentials({ refresh_token: refreshToken });

  // Auto-refresh: googleapis handles this internally when refresh_token is set,
  // but we listen for new tokens to keep the singleton up to date.
  _oauth2Client.on("tokens", (tokens) => {
    if (tokens.access_token) {
      _oauth2Client.setCredentials({
        ...(_oauth2Client.credentials || {}),
        ...tokens,
      });
    }
  });

  return _oauth2Client;
}

/**
 * Returns an authenticated Gmail API client.
 */
export function getGmailClient() {
  return google.gmail({ version: "v1", auth: getGoogleOAuth2Client() });
}

/**
 * Returns an authenticated Google Calendar API client.
 */
export function getCalendarClient() {
  return google.calendar({ version: "v3", auth: getGoogleOAuth2Client() });
}

/**
 * Sends an email via Gmail API using the raw RFC 2822 format.
 * @param {{ to: string, subject: string, body: string, replyTo?: string }} opts
 */
export async function sendGmailEmail({ to, subject, body, replyTo }) {
  const gmail = getGmailClient();
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

  // Base64url encode the message
  const encoded = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const result = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  return result.data;
}
