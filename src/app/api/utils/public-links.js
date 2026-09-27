import { randomBytes } from "node:crypto";

const TABLES = { estimates: "e", invoices: "i" };

export const newPublicToken = () => randomBytes(24).toString("base64url");

/** A token is 32 url-safe characters; anything else is rejected before touching the database. */
export const isPublicToken = (token) => typeof token === "string" && /^[A-Za-z0-9_-]{32}$/.test(token);

/** Return the record's public token, creating one the first time. */
export async function ensurePublicToken(db, table, id) {
  if (!TABLES[table]) throw new Error(`No public links for ${table}`);
  const read = () => db(`SELECT public_token FROM ${table} WHERE id = $1`, [id]);
  const [row] = await read();
  if (!row) return null;
  if (row.public_token) return row.public_token;
  await db(`UPDATE ${table} SET public_token = $1 WHERE id = $2 AND public_token IS NULL`, [newPublicToken(), id]);
  const [after] = await read();
  return after?.public_token ?? null;
}

/** Absolute URL of the customer page, e.g. https://arcanpainting.ca/e/<token>. */
export function publicUrl(table, token, base = process.env.APP_URL || "") {
  return `${base.replace(/\/$/, "")}/${TABLES[table]}/${token}`;
}
