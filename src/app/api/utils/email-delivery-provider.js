function encodeGmailMessage({ from, to, subject, html, text }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
  ];
  return Buffer.from([...headers, "", html || text || ""].join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function getEmailProviderConfig(env = process.env) {
  const requested = String(env.EMAIL_PROVIDER || "").trim().toLowerCase();
  const provider = requested || (env.MATON_API_KEY ? "maton_gmail" : "disabled");
  if (provider === "maton_gmail") {
    return {
      provider,
      label: "Maton Gmail gateway",
      configured: Boolean(env.MATON_API_KEY && env.GOOGLE_EMAIL),
      sender: env.GOOGLE_EMAIL || null,
      reason: env.MATON_API_KEY && env.GOOGLE_EMAIL ? null : "MATON_API_KEY and GOOGLE_EMAIL are required",
    };
  }
  if (provider === "http_email") {
    let endpointValid = false;
    try { endpointValid = new URL(env.EMAIL_DELIVERY_ENDPOINT).protocol === "https:"; } catch {}
    return {
      provider,
      label: "Configured HTTP email provider",
      configured: Boolean(endpointValid && env.EMAIL_DELIVERY_TOKEN && env.EMAIL_FROM),
      sender: env.EMAIL_FROM || null,
      reason: endpointValid && env.EMAIL_DELIVERY_TOKEN && env.EMAIL_FROM ? null : "HTTPS EMAIL_DELIVERY_ENDPOINT, EMAIL_DELIVERY_TOKEN, and EMAIL_FROM are required",
    };
  }
  return {
    provider: "disabled",
    label: "Disabled",
    configured: false,
    sender: null,
    reason: requested && requested !== "disabled" ? `Unsupported EMAIL_PROVIDER: ${requested}` : "No email provider is configured",
  };
}

export async function deliverEmail({ from, to, subject, html, text }, { env = process.env, fetchImpl = fetch } = {}) {
  const config = getEmailProviderConfig(env);
  if (!config.configured) throw new Error(config.reason);

  if (config.provider === "maton_gmail") {
    const response = await fetchImpl("https://gateway.maton.ai/google-mail/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.MATON_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encodeGmailMessage({ from, to, subject, html, text }) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Email provider rejected the message [${response.status}]`);
    return { id: data?.id || null, provider: config.provider, accepted: true };
  }

  const response = await fetchImpl(env.EMAIL_DELIVERY_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.EMAIL_DELIVERY_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html: html || null, text: text || null }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || data?.error || `Email provider rejected the message [${response.status}]`);
  return { id: data?.id || data?.messageId || null, provider: config.provider, accepted: true };
}
