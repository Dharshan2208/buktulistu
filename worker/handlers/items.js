const VALID_PRIORITIES = ["low", "medium", "high"];

function errorResponse(message, status) {
  return Response.json(
    {
      error: message,
    },
    {
      status,
    },
  );
}

export async function getItems(env) {
  const result = await env.bucketlist_db
    .prepare(
      `
      SELECT *
      FROM bucket_items
      ORDER BY created_at DESC
      `,
    )
    .all();

  return Response.json(result.results);
}

export async function createItem(request, env) {
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!title) {
    return errorResponse("Title is required", 400);
  }

  const newItem = await env.bucketlist_db
    .prepare(
      `
      INSERT INTO bucket_items (
        title,
        description,
        category,
        priority,
        target_date
      )
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
      `,
    )
    .bind(
      title,
      body.description ?? null,
      body.category ?? "general",
      body.priority ?? "medium",
      body.target_date ?? null,
    )
    .first();

  return Response.json(newItem, {
    status: 201,
  });
}

export async function deleteItem(env, itemId) {
  const result = await env.bucketlist_db
    .prepare(
      `
      DELETE FROM bucket_items
      WHERE id = ?
      `,
    )
    .bind(itemId)
    .run();

  if (result.meta.changes === 0) {
    return errorResponse("Bucket item not found", 404);
  }

  return new Response(null, {
    status: 204,
  });
}

export async function updateItem(request, env, itemId) {
  let body;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse("Request body must be a JSON object", 400);
  }

  const assignments = [];
  const values = [];

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return errorResponse("Title is required", 400);
    }

    assignments.push("title = ?");
    values.push(title);
  }

  if (body.category !== undefined) {
    const category =
      typeof body.category === "string" ? body.category.trim() : "";

    if (!category) {
      return errorResponse("Category is required", 400);
    }

    assignments.push("category = ?");
    values.push(category);
  }

  if (body.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(body.priority)) {
      return errorResponse("Priority must be low, medium, or high", 400);
    }

    assignments.push("priority = ?");
    values.push(body.priority);
  }

  if (body.completed !== undefined) {
    let completed;

    if (typeof body.completed === "boolean") {
      completed = body.completed ? 1 : 0;
    } else if (body.completed === 0 || body.completed === 1) {
      completed = body.completed;
    } else {
      return errorResponse("Completed must be a boolean", 400);
    }

    assignments.push("completed = ?");
    values.push(completed);
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      return errorResponse("Description must be a string or null", 400);
    }

    assignments.push("description = ?");
    values.push(body.description || null);
  }

  if (body.target_date !== undefined) {
    if (body.target_date !== null && typeof body.target_date !== "string") {
      return errorResponse("Target date must be a string or null", 400);
    }

    assignments.push("target_date = ?");
    values.push(body.target_date || null);
  }

  if (assignments.length === 0) {
    return errorResponse("At least one field must be updated", 400);
  }

  const updatedItem = await env.bucketlist_db
    .prepare(
      `
      UPDATE bucket_items
      SET
        ${assignments.join(", ")},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
      `,
    )
    .bind(...values, itemId)
    .first();

  if (!updatedItem) {
    return errorResponse("Bucket item not found", 404);
  }

  return Response.json(updatedItem);
}
