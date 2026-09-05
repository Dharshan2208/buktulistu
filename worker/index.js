import {
  createItem,
  deleteItem,
  getItems,
  updateItem,
} from "./handlers/items.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
      });
    }

    if (url.pathname === "/api/items" && request.method === "GET") {
      return getItems(env);
    }

    if (url.pathname === "/api/items" && request.method === "POST") {
      return createItem(request, env);
    }

    const itemRoute = url.pathname.match(/^\/api\/items\/(\d+)$/);

    if (itemRoute) {
      const itemId = Number(itemRoute[1]);

      if (request.method === "PATCH") {
        return updateItem(request, env, itemId);
      }

      if (request.method === "DELETE") {
        return deleteItem(env, itemId);
      }
    }

    return new Response("Not Found", {
      status: 404,
    });
  },
};
