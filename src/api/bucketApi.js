export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.fields = options.fields ?? {};
    this.requestId = options.requestId;
  }
}

async function apiRequest(path, options = {}, fallbackMessage) {
  let response;

  try {
    response = await fetch(path, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Could not connect to the server", {
      code: "NETWORK_ERROR",
    });
  }

  const requestId = response.headers.get("X-Request-ID");
  let payload = null;

  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      throw new ApiError("The server returned an invalid response", {
        status: response.status,
        code: "INVALID_RESPONSE",
        requestId,
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(payload?.error ?? fallbackMessage, {
      status: response.status,
      code: payload?.code,
      fields: payload?.fields,
      requestId,
    });
  }

  return payload;
}

export function getItems() {
  return apiRequest(
    "/api/items",
    { method: "GET", cache: "no-store" },
    "Failed to load bucket items",
  );
}

export function createItem(item) {
  return apiRequest(
    "/api/items",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    },
    "Failed to create bucket item",
  );
}

export function deleteItem(id) {
  return apiRequest(
    `/api/items/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete bucket item",
  );
}

export function updateItem(id, updates) {
  return apiRequest(
    `/api/items/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
    "Failed to update bucket item",
  );
}

/**
 * Resolve the current session's role, or null when there is no valid session.
 * A missing/invalid session is expected state (401), so it resolves to null
 * instead of throwing; real failures (network, server) still throw.
 */
export async function getCurrentSession() {
  try {
    const payload = await apiRequest(
      "/api/auth/me",
      { method: "GET", cache: "no-store" },
      "Failed to check your session",
    );

    return payload.role;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export function login(password) {
  return apiRequest(
    "/api/auth",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    },
    "Failed to sign in",
  );
}

export function logout() {
  return apiRequest(
    "/api/auth/logout",
    { method: "POST" },
    "Failed to sign out",
  );
}
