import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { loadArticles } from "./content";
import { getConfig } from "./config";
import { renderHome, renderArticle, renderListing, renderSearch, renderLogin, render404, renderUnsubscribe } from "./templates";
import { getSession, destroySession, createSession, SESSION_COOKIE_NAME } from "./auth/sessions";
import { getUserContext } from "./auth/middleware";
import { generateMagicToken, verifyMagicToken, sendMagicLinkEmail } from "./auth/magic-link";
import { checkMembership } from "./auth/bmac";
import { getComments, addComment, deleteComment } from "./community/storage";
import { isArticleGated } from "./vault/paywall";
import { clientIp, isVerifiedSearchBot, INDEXNOW_KEY } from "./seo";
import { addSubscriber, sendWelcomeEmail, getSubscriberCount, verifyUnsubscribeToken, removeSubscriber } from "./newsletter/subscribers";

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

const app = new Elysia()
  .use(staticPlugin({ prefix: "/images", assets: "public/images" }))
  // ── Home ─────────────────────────────────────────────────────
  .get("/", async ({ query }) => {
    const articles = await loadArticles();
    const subStatus = query.subscribed === "1" ? "success" : query.subscribe_error === "1" ? "error" : null;
    return html(renderHome(articles, subStatus));
  })

  // ── Article ──────────────────────────────────────────────────
  .get("/articles/:slug", async ({ params, headers: reqHeaders }) => {
    const all = await loadArticles();
    const article = all.find((a) => a.slug === params.slug);
    if (!article) return html(render404(), 404);
    const user = await getUserContext(reqHeaders["cookie"]);
    const comments = await getComments(params.slug);
    const crawler = isArticleGated(article) && (await isVerifiedSearchBot(clientIp(reqHeaders), reqHeaders["user-agent"]));
    const res = html(renderArticle(article, user, comments, all, crawler));
    if (isArticleGated(article)) res.headers.set("Cache-Control", "private, no-store");
    return res;
  })

  // ── Unsubscribe ─────────────────────────────────────────────
  .get("/unsubscribe", async ({ query }) => {
    const token = query.token;
    if (!token) return html(renderUnsubscribe(false));
    const email = verifyUnsubscribeToken(token);
    if (!email) return html(renderUnsubscribe(false));
    await removeSubscriber(email);
    return html(renderUnsubscribe(true));
  })

  // ── Archive (all articles) ──────────────────────────────────
  .get("/archive", async () => {
    const articles = await loadArticles();
    return html(renderListing("Archive", articles, "/archive"));
  })

  // ── Category pages ──────────────────────────────────────────
  .get("/category/:slug", async ({ params }) => {
    const articles = await loadArticles();
    const filtered = articles.filter((a) => a.category === params.slug);
    const cfg = getConfig();
    const cat = cfg.categories.find((c) => c.slug === params.slug);
    return html(renderListing(cat?.name || params.slug, filtered, `/category/${params.slug}`));
  })

  // ── Tag pages ───────────────────────────────────────────────
  .get("/tag/:slug", async ({ params }) => {
    const articles = await loadArticles();
    const filtered = articles.filter((a) => a.tags.includes(params.slug));
    return html(renderListing(`Tag: ${params.slug}`, filtered, `/tag/${params.slug}`));
  })

  // ── Search ──────────────────────────────────────────────────
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

  // ── RSS Feed ────────────────────────────────────────────────
  .get("/rss", async () => {
    const c = getConfig();
    const articles = await loadArticles();
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const items = articles
      .map((a) => {
        const gated = isArticleGated(a);
        const desc = gated ? esc(a.excerpt) : esc(a.excerpt || a.body.slice(0, 500));
        return `<item><title>${esc(a.title)}</title><link>${c.url}/articles/${a.slug}</link><description>${desc}</description><pubDate>${new Date(a.date).toUTCString()}</pubDate></item>`;
      })
      .join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(c.name)}</title><description>${esc(c.description)}</description><link>${c.url}</link>\n${items}\n</channel></rss>`;
    return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
  })

  // ── Subscriber count API ─────────────────────────────────────
  .get("/api/subscriber-count", async () => {
    const cfg = getConfig();
    const base = parseInt(cfg.subscriberCountText.replace(/,/g, ""), 10) || 0;
    const localCount = await getSubscriberCount();
    const total = base + localCount;
    const display = total.toLocaleString("en-US");
    return Response.json({ count: total, display });
  })

  // ── Sitemap ──────────────────────────────────────────────────
  .get("/sitemap.xml", async () => {
    const c = getConfig();
    const articles = await loadArticles();
    const urls = [
      `<url><loc>${c.url}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      ...c.categories.map((cat) => `<url><loc>${c.url}/category/${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
      ...articles.map((a) => `<url><loc>${c.url}/articles/${a.slug}</loc><lastmod>${a.date}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`),
    ].join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
    return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
  })

  // ── Robots.txt ──────────────────────────────────────────────
  .get("/robots.txt", () => {
    const c = getConfig();
    const txt = `User-agent: *\nAllow: /\n\nSitemap: ${c.url}/sitemap.xml`;
    return new Response(txt, { headers: { "Content-Type": "text/plain" } });
  })

  // ── IndexNow key verification ──────────────────────────────
  .get(`/${INDEXNOW_KEY}.txt`, () => {
    return new Response(INDEXNOW_KEY, { headers: { "Content-Type": "text/plain" } });
  })

  // ── Auth: Login page ────────────────────────────────────────
  .get("/auth/login", () => {
    return html(renderLogin());
  })

  // ── Auth: Send magic link ───────────────────────────────────
  .post("/auth/login", async ({ body }) => {
    const email = ((body as any)?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return html(renderLogin("Please enter a valid email address."));
    }

    const token = generateMagicToken(email);
    const cfg = getConfig();
    const magicUrl = `${cfg.url}/auth/verify?token=${encodeURIComponent(token)}`;

    const sent = await sendMagicLinkEmail(email, magicUrl);
    if (!sent) {
      return html(renderLogin("Failed to send email. Please try again."));
    }

    return html(renderLogin(undefined, true));
  })

  // ── Auth: Verify magic link ─────────────────────────────────
  .get("/auth/verify", async ({ query }) => {
    const token = query.token;
    if (!token) return html(render404(), 400);

    const email = verifyMagicToken(token);
    if (!email) {
      return html(renderLogin("This link has expired or is invalid. Please request a new one."));
    }

    // Check BMaC membership
    const membership = await checkMembership(email);
    const isPatron = membership?.isPatron || false;
    const displayName = membership?.name || email.split("@")[0];

    const cfg = getConfig();
    const sessionToken = await createSession({
      userId: email,
      displayName,
      isPatron,
      lastPledgeCheck: Date.now(),
    }, cfg.sessionExpirationDays * 24 * 60 * 60 * 1000);

    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `${SESSION_COOKIE_NAME}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cfg.sessionExpirationDays * 86400}`,
      },
    });
  })

  // ── Auth: Logout ────────────────────────────────────────────
  .get("/logout", async ({ headers: reqHeaders }) => {
    const cookies = reqHeaders["cookie"] || "";
    const match = cookies.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match?.[1]) await destroySession(match[1]);
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`,
      },
    });
  })

  // ── Comments: Submit ────────────────────────────────────────
  .post("/articles/:slug/comments", async ({ params, body, headers: reqHeaders }) => {
    const user = await getUserContext(reqHeaders["cookie"]);
    if (!user.isLoggedIn || !user.isPatron) {
      return new Response("Forbidden", { status: 403 });
    }
    const commentBody = ((body as any)?.body || "").trim();
    if (!commentBody) {
      return new Response("Comment body required", { status: 400 });
    }
    await addComment(params.slug, {
      authorId: user.userId!,
      authorName: user.displayName || "Patron",
      body: commentBody,
    });
    return new Response(null, {
      status: 303,
      headers: { Location: `/articles/${params.slug}#comments` },
    });
  })

  // ── Comments: Delete (admin) ────────────────────────────────
  .post("/articles/:slug/comments/:id/delete", async ({ params, headers: reqHeaders }) => {
    const user = await getUserContext(reqHeaders["cookie"]);
    const adminIds = getConfig().adminUserIds;
    if (!user.userId || !adminIds.includes(user.userId)) {
      return new Response("Forbidden", { status: 403 });
    }
    await deleteComment(params.slug, params.id);
    return new Response(null, {
      status: 303,
      headers: { Location: `/articles/${params.slug}#comments` },
    });
  })

  // ── Subscribe ───────────────────────────────────────────────
  .post("/subscribe", async ({ body }) => {
    const email = ((body as any)?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(null, { status: 303, headers: { Location: "/?subscribe_error=1" } });
    }
    const isNew = await addSubscriber(email);
    if (isNew) {
      sendWelcomeEmail(email).catch((err) => console.error("[subscribe] welcome email failed:", err));
    }
    return new Response(null, {
      status: 303,
      headers: { Location: "/?subscribed=1" },
    });
  })
  .listen(8001);

const cfg = getConfig();
console.log(`⚒  ${cfg.name} running at http://localhost:${app.server!.port}`);
