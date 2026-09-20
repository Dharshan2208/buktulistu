import { errorResponse, readJsonObject } from "../utils/http.js";
import {
  validateCreateItem,
  validateReaction,
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

function itemWithReactions(item) {
  const { reactions_json, ...rest } = item;
  return {
    ...rest,
    reactingFriendIds: JSON.parse(reactions_json ?? "[]"),
  };
}

const SELECT_ITEMS_SQL = `
  SELECT
    i.*,
    COALESCE((
      SELECT json_group_array(r.friend_id)
      FROM reactions r
      WHERE r.item_id = i.id
      ORDER BY r.friend_id
    ), '[]') AS reactions_json
  FROM bucket_items i
`;

export async function getItems(env) {
  const result = await env.bucketlist_db
    .prepare(
      `
      ${SELECT_ITEMS_SQL}
      ORDER BY created_at DESC
      `,
    )
    .all();

  return Response.json(result.results.map(itemWithReactions));
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
        target_date,
        owner_id
      )
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING *
      `,
    )
    .bind(
      data.title,
      data.description,
      data.category,
      data.priority,
      data.target_date,
      data.ownerId,
    )
    .first();

  return Response.json(itemWithReactions(newItem), { status: 201 });
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

  await env.bucketlist_db
    .prepare(
      `
      DELETE FROM reactions
      WHERE item_id = ?
      `,
    )
    .bind(itemId)
    .run();

  return new Response(null, { status: 204 });
}

export async function toggleReaction(request, env, itemId) {
  const parsed = await readJsonObject(request);

  if (parsed.response) return parsed.response;

  const { data, fields } = validateReaction(parsed.body);

  if (Object.keys(fields).length > 0) return validationError(fields);

  const item = await env.bucketlist_db
    .prepare(
      `
      SELECT id
      FROM bucket_items
      WHERE id = ?
      `,
    )
    .bind(itemId)
    .first();

  if (!item) {
    return errorResponse(
      "Bucket item not found",
      404,
      "ITEM_NOT_FOUND",
    );
  }

  if (data.active) {
    await env.bucketlist_db
      .prepare(
        `
        INSERT OR IGNORE INTO reactions (item_id, friend_id)
        VALUES (?, ?)
        `,
      )
      .bind(itemId, data.friendId)
      .run();
  } else {
    await env.bucketlist_db
      .prepare(
        `
        DELETE FROM reactions
        WHERE item_id = ? AND friend_id = ?
        `,
      )
      .bind(itemId, data.friendId)
      .run();
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
