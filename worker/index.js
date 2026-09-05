export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    return new Response("Not Found", {
      status: 404,
    });
  },
};
