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

async function findItemById(database, itemId) {
  return database
    .prepare(
      `
      SELECT *
      FROM bucket_items
      WHERE id = ?
      `,
    )
    .bind(itemId)
    .first();
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

  const insertResult = await env.bucketlist_db
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
      `,
    )
    .bind(
      title,
      body.description ?? null,
      body.category ?? "general",
      body.priority ?? "medium",
      body.target_date ?? null,
    )
    .run();

  const newItem = await findItemById(
    env.bucketlist_db,
    insertResult.meta.last_row_id,
  );

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

  const currentItem = await findItemById(env.bucketlist_db, itemId);

  if (!currentItem) {
    return errorResponse("Bucket item not found", 404);
  }

  const title =
    body.title === undefined
      ? currentItem.title
      : typeof body.title === "string"
        ? body.title.trim()
        : "";

  if (!title) {
    return errorResponse("Title is required", 400);
  }

  const category =
    body.category === undefined
      ? currentItem.category
      : typeof body.category === "string"
        ? body.category.trim()
        : "";

  if (!category) {
    return errorResponse("Category is required", 400);
  }

  const priority =
    body.priority === undefined ? currentItem.priority : body.priority;

  if (!VALID_PRIORITIES.includes(priority)) {
    return errorResponse("Priority must be low, medium, or high", 400);
  }

  let completed = currentItem.completed;

  if (body.completed !== undefined) {
    if (typeof body.completed === "boolean") {
      completed = body.completed ? 1 : 0;
    } else if (body.completed === 0 || body.completed === 1) {
      completed = body.completed;
    } else {
      return errorResponse("Completed must be a boolean", 400);
    }
  }

  const description =
    body.description === undefined
      ? currentItem.description
      : body.description || null;

  const targetDate =
    body.target_date === undefined
      ? currentItem.target_date
      : body.target_date || null;

  await env.bucketlist_db
    .prepare(
      `
      UPDATE bucket_items
      SET
        title = ?,
        description = ?,
        category = ?,
        priority = ?,
        completed = ?,
        target_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
    )
    .bind(title, description, category, priority, completed, targetDate, itemId)
    .run();

  const updatedItem = await findItemById(env.bucketlist_db, itemId);

  return Response.json(updatedItem);
}
