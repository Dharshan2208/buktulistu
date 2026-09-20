/**
 * Session auth primitives for the Buktu Listu worker.
 *
 * Sessions are JSON payloads signed with HMAC-SHA256 using SESSION_SECRET:
 *   token = base64url(payload) + "." + base64url(hmac(payload))
 *   payload = { r: "owner" | "viewer", exp: <unix seconds> }
 *
 * The role is unforgeable without SESSION_SECRET, so a viewer cannot escalate
 * themselves to owner by editing the cookie.
 */

export const SESSION_COOKIE_NAME = "buktu_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const VALID_ROLES = new Set(["owner", "viewer"]);
const encoder = new TextEncoder();

let cachedKey = null;

function requireSecret(secret) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return secret;
}

async function getHmacKey(rawSecret) {
  const secret = requireSecret(rawSecret);

  if (cachedKey?.secret === secret) {
    return cachedKey.key;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  cachedKey = { secret, key };
  return key;
}

function bytesToBase64Url(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/**
 * Compare two strings in (content-)constant time by comparing HMAC digests.
 * Digests are always the same length, so the comparison loop leaks nothing
 * about the inputs themselves.
 */
export async function constantTimeEqual(first, second, secret) {
  const key = await getHmacKey(secret);
  const [firstDigest, secondDigest] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(first)),
    crypto.subtle.sign("HMAC", key, encoder.encode(second)),
  ]);

  const firstBytes = new Uint8Array(firstDigest);
  const secondBytes = new Uint8Array(secondDigest);
  let difference = 0;

  for (let index = 0; index < firstBytes.length; index += 1) {
    difference |= firstBytes[index] ^ secondBytes[index];
  }

  return difference === 0;
}

export async function createSessionToken(role, secret) {
  const payload = JSON.stringify({
    r: role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const key = await getHmacKey(secret);
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payload)),
  );

  return `${bytesToBase64Url(encoder.encode(payload))}.${bytesToBase64Url(signature)}`;
}

/**
 * Verify and decode a session token.
 * Returns `{ role }` or `null` when missing, malformed, expired, or unsigned.
 */
export async function readSessionToken(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;

  const [payloadPart, signaturePart] = token.split(".");

  if (!payloadPart || !signaturePart) return null;

  let payloadBytes;
  let signatureBytes;

  try {
    payloadBytes = base64UrlToBytes(payloadPart);
    signatureBytes = base64UrlToBytes(signaturePart);
  } catch {
    return null;
  }

  let key;

  try {
    key = await getHmacKey(secret);
  } catch (error) {
    console.error("Unable to verify session: SESSION_SECRET is not configured", error);
    return null;
  }

  const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, payloadBytes);

  if (!valid) return null;

  let payload;

  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return null;
  }

  if (
    typeof payload.r !== "string" ||
    !VALID_ROLES.has(payload.r) ||
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return { role: payload.r };
}