import { getCurrentUser, login, logout, me } from "./handlers/auth.js";
import { createItem, deleteItem, getItems, updateItem } from "./handlers/items.js";
import { addApiHeaders, errorResponse } from "./utils/http.js";

const WRITE_METHODS = new Set(["POST", "PATCH", "DELETE"]);

function methodNotAllowed(allowedMethods) {
  const response = errorResponse(
    "Method not allowed",
    405,
    "METHOD_NOT_ALLOWED",
  );

  response.headers.set("Allow", allowedMethods.join(", "));
  return response;
}

function unauthorized() {
  return errorResponse(
    "Authentication is required to view this list",
    401,
    "NOT_AUTHENTICATED",
  );
}

function forbidden() {
  return errorResponse(
    "Only the list owner can make changes",
    403,
    "FORBIDDEN",
  );
}

function hasValidOrigin(request, requestUrl) {
  const origin = request.headers.get("Origin");

  if (!origin) return true;

  try {
    return new URL(origin).origin === requestUrl.origin;
  } catch {
    return false;
  }
}

async function requireOwner(request, env) {
  const user = await getCurrentUser(request, env);

  if (!user) return unauthorized();
  if (user.role !== "owner") return forbidden();

  return null;
}

async function routeRequest(request, env, url) {
  if (url.pathname === "/api/health") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    return Response.json({ status: "ok" });
  }

  if (url.pathname === "/api/auth/me") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    return me(request, env);
  }

  if (url.pathname === "/api/auth/logout") {
    if (request.method !== "POST") return methodNotAllowed(["POST"]);
    return logout(url);
  }

  if (url.pathname === "/api/auth") {
    if (request.method !== "POST") return methodNotAllowed(["POST"]);
    return login(request, env, url);
  }

  if (url.pathname === "/api/items") {
    if (request.method === "GET") {
      const user = await getCurrentUser(request, env);

      if (!user) return unauthorized();

      return getItems(env);
    }

    if (request.method === "POST") {
      const denied = await requireOwner(request, env);

      if (denied) return denied;

      return createItem(request, env);
    }

    return methodNotAllowed(["GET", "POST"]);
  }

  const itemRoute = url.pathname.match(/^\/api\/items\/([1-9]\d*)$/);

  if (itemRoute) {
    const itemId = Number(itemRoute[1]);

    if (request.method === "PATCH") {
      const denied = await requireOwner(request, env);

      if (denied) return denied;

      return updateItem(request, env, itemId);
    }

    if (request.method === "DELETE") {
      const denied = await requireOwner(request, env);

      if (denied) return denied;

      return deleteItem(env, itemId);
    }

    return methodNotAllowed(["PATCH", "DELETE"]);
  }

  return errorResponse("Endpoint not found", 404, "NOT_FOUND");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestId = request.headers.get("CF-Ray") ?? crypto.randomUUID();
    let response;

    try {
      if (
        url.pathname.startsWith("/api/") &&
        WRITE_METHODS.has(request.method) &&
        !hasValidOrigin(request, url)
      ) {
        response = errorResponse(
          "Cross-origin request denied",
          403,
          "INVALID_ORIGIN",
        );
      } else {
        response = await routeRequest(request, env, url);
      }
    } catch (error) {
      console.error("Unhandled API error", {
        requestId,
        method: request.method,
        pathname: url.pathname,
        error,
      });

      response = errorResponse(
        "An unexpected server error occurred",
        500,
        "INTERNAL_ERROR",
      );
    }

    return addApiHeaders(response, requestId);
  },
};