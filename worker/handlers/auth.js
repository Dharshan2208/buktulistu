import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  constantTimeEqual,
  createSessionToken,
  readSessionToken,
} from "../auth.js";
import { errorResponse, readJsonObject } from "../utils/http.js";

const MAX_PASSWORD_LENGTH = 200;

function parseCookies(cookieHeader) {
  const cookies = {};

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) continue;

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if (name) {
      cookies[name] = decodeURIComponent(value);
    }
  }

  return cookies;
}

function buildSessionCookie(value, requestUrl, maxAgeSeconds) {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (requestUrl.protocol === "https:") {
    attributes.push("Secure");
  }

  if (maxAgeSeconds === 0) {
    attributes.push("Max-Age=0");
    attributes.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  } else {
    attributes.push(`Max-Age=${maxAgeSeconds}`);
  }

  return attributes.join("; ");
}

function requireConfiguredPassword(env, name) {
  const password = env[name];

  if (typeof password === "string" && password.length > 0) {
    return password;
  }

  console.error(`${name} is not configured`);
  return null;
}

/** Resolve the current session from the request cookie. Returns `{ role }` or null. */
export async function getCurrentUser(request, env) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = parseCookies(cookieHeader)[SESSION_COOKIE_NAME];

  if (!token) return null;

  return readSessionToken(token, env.SESSION_SECRET);
}

export async function login(request, env, requestUrl) {
  const parsed = await readJsonObject(request);

  if (parsed.response) return parsed.response;

  const password = parsed.body?.password;

  if (typeof password !== "string" || password.length === 0) {
    return errorResponse("Password is required", 400, "INVALID_PASSWORD");
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return errorResponse("Password is too long", 413, "INVALID_PASSWORD");
  }

  const ownerPassword = requireConfiguredPassword(env, "OWNER_PASSWORD");
  const viewerPassword = requireConfiguredPassword(env, "VIEWER_PASSWORD");

  if (ownerPassword === null || viewerPassword === null) {
    return errorResponse(
      "Authentication is not configured on the server",
      500,
      "AUTH_NOT_CONFIGURED",
    );
  }

  let role = null;

  if (await constantTimeEqual(password, ownerPassword, env.SESSION_SECRET)) {
    role = "owner";
  } else if (
    await constantTimeEqual(password, viewerPassword, env.SESSION_SECRET)
  ) {
    role = "viewer";
  }

  if (role === null) {
    return errorResponse(
      "Incorrect password. Please try again.",
      401,
      "INVALID_CREDENTIALS",
    );
  }

  const token = await createSessionToken(role, env.SESSION_SECRET);
  const response = Response.json({ role });

  response.headers.set(
    "Set-Cookie",
    buildSessionCookie(token, requestUrl, SESSION_TTL_SECONDS),
  );

  return response;
}

export function logout(requestUrl) {
  const response = new Response(null, { status: 204 });

  response.headers.set(
    "Set-Cookie",
    buildSessionCookie("", requestUrl, 0),
  );

  return response;
}

export async function me(request, env) {
  const user = await getCurrentUser(request, env);

  if (!user) {
    return errorResponse("No active session", 401, "NOT_AUTHENTICATED");
  }

  return Response.json({ role: user.role });
}