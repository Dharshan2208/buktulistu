import { errorResponse, readJsonObject } from "../utils/http.js";
import {
  validateCreateItem,
  validateUpdateItem,
} from "../utils/validation.js";

const UPDATE_COLUMNS = {
  title: "title",
  description: "description",
  category: "category",
  priority: "priority",
  completed: "completed",
  target_date: "target_date",
};

function validationError(fields) {
  return errorResponse(
    "Please correct the invalid fields",
    422,
    "VALIDATION_ERROR",
    fields,
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
  const parsed = await readJsonObject(request);

  if (parsed.response) return parsed.response;

  const { data, fields } = validateCreateItem(parsed.body);

  if (Object.keys(fields).length > 0) return validationError(fields);

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
      data.title,
      data.description,
      data.category,
      data.priority,
      data.target_date,
    )
    .first();

  return Response.json(newItem, { status: 201 });
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
    return errorResponse(
      "Bucket item not found",
      404,
      "ITEM_NOT_FOUND",
    );
  }

  return new Response(null, { status: 204 });
}

export async function updateItem(request, env, itemId) {
  const parsed = await readJsonObject(request);

  if (parsed.response) return parsed.response;

  const { data, fields } = validateUpdateItem(parsed.body);

  if (Object.keys(fields).length > 0) return validationError(fields);

  const assignments = [];
  const values = [];

  for (const [field, value] of Object.entries(data)) {
    assignments.push(`${UPDATE_COLUMNS[field]} = ?`);
    values.push(field === "completed" ? (value ? 1 : 0) : value);
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
    return errorResponse(
      "Bucket item not found",
      404,
      "ITEM_NOT_FOUND",
    );
  }

  return Response.json(updatedItem);
}
