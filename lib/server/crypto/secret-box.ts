import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM envelope for provider tokens: "v1.<iv>.<tag>.<ciphertext>" (base64url).
// The additional-authenticated-data binds a ciphertext to the row it belongs to, so it cannot be swapped between rows.
const VERSION = "v1";

function key() {
  const bytes = Buffer.from(process.env.BANK_TOKEN_ENCRYPTION_KEY ?? "", "base64");
  if (bytes.length !== 32) throw new Error("BANK_TOKEN_ENCRYPTION_KEY must be 32 base64-encoded bytes");
  return bytes;
}

export function isSecretBoxConfigured() {
  try { key(); return true; } catch { return false; }
}

export function seal(plaintext: string, aad: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(aad));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [VERSION, ...[iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url"))].join(".");
}

export function open(sealed: string, aad: string) {
  const [version, iv, tag, ciphertext] = sealed.split(".");
  if (version !== VERSION || !iv || !tag || !ciphertext) throw new Error("Unsupported secret envelope");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}
