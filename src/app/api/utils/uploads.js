import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Where uploaded files live. Keep it outside the deploy directory in production. */
export function uploadRoot() {
  return process.env.UPLOAD_ROOT || path.join(process.cwd(), "uploads");
}

/** Identify a file by its first bytes, not by the name or type the browser sent. */
export function sniffType(bytes) {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { ext: "gif", mime: "image/gif" };
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") {
    return { ext: "webp", mime: "image/webp" };
  }
  if (String.fromCharCode(...b.slice(4, 8)) === "ftyp" && /^(heic|heix|mif1|msf1)$/.test(String.fromCharCode(...b.slice(8, 12)))) {
    return { ext: "heic", mime: "image/heic" };
  }
  if (String.fromCharCode(...b.slice(0, 5)) === "%PDF-") return { ext: "pdf", mime: "application/pdf" };
  return null;
}

/** Save bytes under UPLOAD_ROOT/YYYY/MM/ with an unguessable name; returns the public URL. */
export async function saveUpload(bytes, now = new Date()) {
  if (bytes.length === 0) return { error: "The file is empty.", status: 400 };
  if (bytes.length > MAX_UPLOAD_BYTES) return { error: "File too large (10 MB max).", status: 413 };
  const type = sniffType(bytes);
  if (!type) return { error: "Only photos (JPEG, PNG, WebP, GIF, HEIC) and PDFs can be uploaded.", status: 415 };

  const folder = path.join(String(now.getUTCFullYear()), String(now.getUTCMonth() + 1).padStart(2, "0"));
  const name = `${randomBytes(16).toString("hex")}.${type.ext}`;
  await mkdir(path.join(uploadRoot(), folder), { recursive: true });
  await writeFile(path.join(uploadRoot(), folder, name), bytes, { flag: "wx" });
  return { url: `/uploads/${folder.split(path.sep).join("/")}/${name}`, mimeType: type.mime };
}
