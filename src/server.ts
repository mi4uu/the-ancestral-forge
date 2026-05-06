import { Elysia } from "elysia";
import { loadArticles, loadArticle } from "./content";
import { renderHome, renderArticle, render404 } from "./templates";

const app = new Elysia()
  .get("/", async () => {
    const articles = await loadArticles();
    return new Response(renderHome(articles), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  })
  .get("/articles/:slug", async ({ params }) => {
    const article = await loadArticle(params.slug);
    if (!article) {
      return new Response(render404(), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response(renderArticle(article), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  })
  .post("/subscribe", async ({ body }) => {
    // placeholder — log and redirect
    console.log("Subscribe:", body);
    return new Response(null, {
      status: 303,
      headers: { Location: "/?subscribed=1" },
    });
  })
  .listen(8001);

console.log(`⚒  The Ancestral Forge running at http://localhost:${app.server!.port}`);
