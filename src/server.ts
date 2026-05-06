import { Elysia } from "elysia";
import { loadArticles, loadArticle } from "./content";
import { getConfig } from "./config";
import { renderHome, renderArticle, renderListing, renderSearch, render404 } from "./templates";
import { getSession, destroySession, createSession, SESSION_COOKIE_NAME } from "./auth/sessions";
import { getLoginRedirectUrl, exchangeCodeForToken, fetchPatreonUser } from "./auth/patreon";

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

const app = new Elysia()
  // ── Home ─────────────────────────────────────────────────────
  .get("/", async () => {
    const articles = await loadArticles();
    return html(renderHome(articles));
  })

  // ── Article ──────────────────────────────────────────────────
  .get("/articles/:slug", async ({ params }) => {
    const article = await loadArticle(params.slug);
    if (!article) return html(render404(), 404);
    return html(renderArticle(article));
  })

  // ── Category pages (T-018 placeholder route) ─────────────────
  .get("/category/:slug", async ({ params }) => {
    const articles = await loadArticles();
    const filtered = articles.filter((a) => a.category === params.slug);
    const cfg = getConfig();
    const cat = cfg.categories.find((c) => c.slug === params.slug);
    return html(renderListing(cat?.name || params.slug, filtered));
  })

  // ── Tag pages (T-019 placeholder route) ──────────────────────
  .get("/tag/:slug", async ({ params }) => {
    const articles = await loadArticles();
    const filtered = articles.filter((a) => a.tags.includes(params.slug));
    return html(renderListing(`Tag: ${params.slug}`, filtered));
  })

  // ── Search (T-020) ──────────────────────────────────────────
  .get("/search", async ({ query }) => {
    const q = (query.q || "").trim();
    if (!q) return html(renderSearch(q, []));
    const articles = await loadArticles();
    const lower = q.toLowerCase();
    const scored = articles
      .map((a) => {
        let score = 0;
        if (a.title.toLowerCase().includes(lower)) score += 10;
        if (a.excerpt.toLowerCase().includes(lower)) score += 5;
        if (a.body.toLowerCase().includes(lower)) score += 1;
        return { article: a, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return html(renderSearch(q, scored.map((s) => s.article)));
  })

  // ── RSS (T-035 placeholder) ─────────────────────────────────
  .get("/rss", async () => {
    const cfg = getConfig();
    const articles = await loadArticles();
    const items = articles
      .map((a) => `<item><title>${a.title}</title><link>${cfg.url}/articles/${a.slug}</link><description>${a.excerpt}</description><pubDate>${new Date(a.date).toUTCString()}</pubDate></item>`)
      .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${cfg.name}</title><description>${cfg.description}</description><link>${cfg.url}</link>${items}</channel></rss>`;
    return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
  })

  // ── Auth: Login ─────────────────────────────────────────────
  .get("/auth/login", ({ headers }) => {
    const returnTo = headers["referer"] || "/";
    const url = getLoginRedirectUrl(returnTo);
    return Response.redirect(url, 302);
  })

  // ── Auth: Callback ──────────────────────────────────────────
  .get("/auth/callback", async ({ query, set }) => {
    const code = query.code;
    const error = query.error;
    const returnTo = query.state || "/";

    if (error || !code) {
      console.error("[auth] OAuth denied or error:", error);
      return html(render404(), 400); // TODO: proper error page
    }

    try {
      const tokenData = await exchangeCodeForToken(code);
      const user = await fetchPatreonUser(tokenData.access_token);
      const cfg = getConfig();
      const token = await createSession({
        userId: user.id,
        displayName: user.displayName,
        isPatron: user.isPatron,
        lastPledgeCheck: Date.now(),
      }, cfg.sessionExpirationDays * 24 * 60 * 60 * 1000);

      return new Response(null, {
        status: 303,
        headers: {
          Location: typeof returnTo === "string" ? returnTo : "/",
          "Set-Cookie": `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cfg.sessionExpirationDays * 86400}`,
        },
      });
    } catch (err) {
      console.error("[auth] Callback error:", err);
      return html(render404(), 500);
    }
  })

  // ── Auth: Logout ────────────────────────────────────────────
  .get("/logout", async ({ headers: reqHeaders }) => {
    const cookies = reqHeaders["cookie"] || "";
    const match = cookies.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    const token = match?.[1];
    if (token) await destroySession(token);
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`,
      },
    });
  })

  // ── Subscribe ───────────────────────────────────────────────
  .post("/subscribe", async ({ body }) => {
    console.log("Subscribe:", body);
    return new Response(null, {
      status: 303,
      headers: { Location: "/?subscribed=1" },
    });
  })
  .listen(8001);

console.log(`⚒  The Ancestral Forge running at http://localhost:${app.server!.port}`);
