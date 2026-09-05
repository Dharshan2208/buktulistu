export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname == "/api/health") {
      return Response.json({
        status: "ok",
      });
    }

    if (url.pathname == "/api/items" && request.method == "GET"){
        const result = await env.bucketlist_db.prepare(
            'SELECT * FROM bucket_items ORDER BY created_at DESC'
        ).all();

        return Response.json(result.results)
    }

    return new Response("Not Found", {
      status: 404,
    });
  },
};
