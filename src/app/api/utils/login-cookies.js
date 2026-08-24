export function createLoginHeaders(sessionCookie, csrfCookie) {
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.append("Set-Cookie", sessionCookie);
  headers.append("Set-Cookie", csrfCookie);
  return headers;
}
