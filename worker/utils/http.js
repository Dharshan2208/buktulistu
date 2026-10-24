const MAX_JSON_BYTES = 32_768;

export function errorResponse(
  message,
  status,
  code = "BAD_REQUEST",
  fields,
) {
  const payload = { error: message, code };

  if (fields && Object.keys(fields).length > 0) {
    payload.fields = fields;
  }

  return Response.json(payload, { status });
}

export async function readJsonObject(request) {
  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/json") {
    return {
      response: errorResponse(
        "Content-Type must be application/json",
        415,
        "UNSUPPORTED_MEDIA_TYPE",
      ),
    };
  }

  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = Number(contentLengthHeader);

  if (
    contentLengthHeader !== null &&
    Number.isFinite(contentLength) &&
    contentLength > MAX_JSON_BYTES
  ) {
    return {
      response: errorResponse(
        "Request body is too large",
        413,
        "PAYLOAD_TOO_LARGE",
      ),
    };
  }

  let rawBody;

  try {
    rawBody = await request.text();
  } catch {
    return {
      response: errorResponse(
        "Could not read request body",
        400,
        "INVALID_BODY",
      ),
    };
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_JSON_BYTES) {
    return {
      response: errorResponse(
        "Request body is too large",
        413,
        "PAYLOAD_TOO_LARGE",
      ),
    };
  }

  let body;

  try {
    body = JSON.parse(rawBody);
  } catch {
    return {
      response: errorResponse(
        "Request body must contain valid JSON",
        400,
        "INVALID_JSON",
      ),
    };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      response: errorResponse(
        "Request body must be a JSON object",
        400,
        "INVALID_BODY",
      ),
    };
  }

  return { body };
}

export function addApiHeaders(response, requestId) {
  const headers = new Headers(response.headers);

  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Request-ID", requestId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
