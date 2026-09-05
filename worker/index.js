export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const itemRoute = url.pathname.match(/^\/api\/items\/(\d+)$/);
    const itemId = itemRoute ? Number(itemRoute[1]) : null;

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
      });
    }

    if (url.pathname === "/api/items" && request.method === "GET") {
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

    if (url.pathname === "/api/items" && request.method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            error: "Request body must be valid JSON",
          },
          {
            status: 400,
          },
        );
      }

      const title = typeof body?.title === "string" ? body.title.trim() : "";

      if (!title) {
        return Response.json(
          {
            error: "Title is required",
          },
          {
            status: 400,
          },
        );
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

      const newItem = await env.bucketlist_db
        .prepare(
          `
          SELECT *
          FROM bucket_items
          WHERE id = ?
          `,
        )
        .bind(insertResult.meta.last_row_id)
        .first();

      return Response.json(newItem, {
        status: 201,
      });
    }

    if (itemId !== null && request.method === "DELETE") {
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
        return Response.json(
          {
            error: "Bucket item not found",
          },
          {
            status: 404,
          },
        );
      }

      return new Response(null, {
        status: 204,
      });
    }

    if (itemId !== null && request.method === "PATCH") {
      let body;

      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            error: "Request body must be valid JSON",
          },
          {
            status: 400,
          },
        );
      }

      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return Response.json(
          {
            error: "Request body must be a JSON object",
          },
          {
            status: 400,
          },
        );
      }

      const currentItem = await env.bucketlist_db
        .prepare(
          `
      SELECT *
      FROM bucket_items
      WHERE id = ?
      `,
        )
        .bind(itemId)
        .first();

      if (!currentItem) {
        return Response.json(
          {
            error: "Bucket item not found",
          },
          {
            status: 404,
          },
        );
      }

      const title =
        body.title === undefined
          ? currentItem.title
          : typeof body.title === "string"
            ? body.title.trim()
            : "";

      if (!title) {
        return Response.json(
          {
            error: "Title is required",
          },
          {
            status: 400,
          },
        );
      }

      const category =
        body.category === undefined
          ? currentItem.category
          : typeof body.category === "string"
            ? body.category.trim()
            : "";

      if (!category) {
        return Response.json(
          {
            error: "Category is required",
          },
          {
            status: 400,
          },
        );
      }

      const priority =
        body.priority === undefined ? currentItem.priority : body.priority;

      if (!["low", "medium", "high"].includes(priority)) {
        return Response.json(
          {
            error: "Priority must be low, medium, or high",
          },
          {
            status: 400,
          },
        );
      }

      let completed = currentItem.completed;

      if (body.completed !== undefined) {
        if (typeof body.completed === "boolean") {
          completed = body.completed ? 1 : 0;
        } else if (body.completed === 0 || body.completed === 1) {
          completed = body.completed;
        } else {
          return Response.json(
            {
              error: "Completed must be a boolean",
            },
            {
              status: 400,
            },
          );
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
        .bind(
          title,
          description,
          category,
          priority,
          completed,
          targetDate,
          itemId,
        )
        .run();

      const updatedItem = await env.bucketlist_db
        .prepare(
          `
      SELECT *
      FROM bucket_items
      WHERE id = ?
      `,
        )
        .bind(itemId)
        .first();

      return Response.json(updatedItem);
    }

    return new Response("Not Found", {
      status: 404,
    });
  },
};
