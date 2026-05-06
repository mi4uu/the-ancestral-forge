---
created: "2026-05-06"
last_edited: "2026-05-06"
---

# Cavekit: Content

## Scope

Loading articles from the filesystem, rendering markdown to HTML, search, category and tag filtering, RSS feed generation, and SEO metadata. Articles are markdown files with YAML frontmatter, organized as directories. Categories and tags in frontmatter are validated against the Site configuration.

This kit covers the full read path from filesystem to rendered page. It does not cover content creation, editing, image uploads, or publishing workflows.

## Requirements

### R1: Article Loading

**Description:** Articles are loaded from the filesystem. Each article is a directory containing an index markdown file with YAML frontmatter and a markdown body. New articles become available without requiring a server restart.

**Acceptance Criteria:**

- [ ] Each article resides in its own directory, containing a markdown file with YAML frontmatter and body content.
- [ ] Adding a new article directory with a valid markdown file makes the article available on the site without restarting the server.
- [ ] An article with malformed or unparseable frontmatter does not crash the server — the article is skipped and a warning is logged.
- [ ] An article directory missing the expected markdown file is skipped without error.
- [ ] Articles load from a designated content directory (path defined in site configuration or convention).

**Dependencies:** Site R2 (category validation).

---

### R2: Article Metadata

**Description:** Article frontmatter supports a defined set of metadata fields. Only title and date are required; all other fields are optional with sensible defaults.

**Acceptance Criteria:**

- [ ] Frontmatter supports the following fields: title, slug, category, tags (array), author, authorRole, date, readTime, excerpt, illustration, featured (boolean), free (boolean).
- [ ] An article with only title and date in frontmatter loads successfully.
- [ ] If slug is not specified in frontmatter, it defaults to the article's directory name.
- [ ] If tags is not specified, it defaults to an empty array.
- [ ] If featured is not specified, it defaults to false.
- [ ] If free is not specified, it defaults to false.
- [ ] An article with an unrecognized frontmatter field does not cause an error — unknown fields are ignored.

**Dependencies:** None.

---

### R3: Category and Tag Pages

**Description:** Browsable listing pages that show articles filtered by a single category or a single tag. These pages support navigation and discovery.

**Acceptance Criteria:**

- [ ] A category page at the path /category/:slug displays all articles belonging to that category.
- [ ] Articles on category pages are sorted by date, newest first.
- [ ] A tag page at the path /tag/:slug displays all articles with that tag.
- [ ] Articles on tag pages are sorted by date, newest first.
- [ ] A category page with no matching articles displays an informational empty state message, not an error page.
- [ ] A tag page with no matching articles displays an informational empty state message, not an error page.
- [ ] A request for a category or tag slug that does not exist returns the empty state, not a server error.

**Dependencies:** Site R2 (category definitions).

---

### R4: Search

**Description:** Full-text search across article titles, excerpts, and body content. Results are ranked by relevance and presented as a list.

**Acceptance Criteria:**

- [ ] A search endpoint at /search accepts a query parameter q.
- [ ] Search matches against article titles, excerpts, and body content.
- [ ] Search results are ranked by relevance (title matches weighted higher than body matches).
- [ ] Search is case-insensitive — searching "Ashitaba" and "ashitaba" return the same results.
- [ ] A search with no matching results displays an informational empty state message.
- [ ] A search with an empty or missing query parameter displays an appropriate prompt or empty state.

**Dependencies:** R1 (articles must be loaded).

---

### R5: RSS Feed

**Description:** A standard RSS 2.0 feed of published articles. The feed respects the Vault paywall — gated articles include only their excerpt, not the full body.

**Acceptance Criteria:**

- [ ] The path /rss returns an RSS 2.0 XML document.
- [ ] The RSS document passes validation against the RSS 2.0 specification (well-formed XML with required channel and item elements).
- [ ] Each article in the feed includes: title, link, description, and pubDate.
- [ ] Articles that are currently behind the paywall (per Vault rules) include only the excerpt in the description field, not the full body.
- [ ] Articles that are public (past the paywall window or marked free) include the full content or excerpt in the description field.
- [ ] The feed channel element includes site name, site description, and site link from Site configuration.

**Dependencies:** Site R1 (site metadata for feed channel). Vault R1, R4 (paywall rules for content gating).

---

### R6: SEO Metadata

**Description:** Every page includes appropriate meta tags for search engines and social media sharing.

**Acceptance Criteria:**

- [ ] Article pages include: a title tag, meta description, og:title, og:description, and og:image (when an illustration is present).
- [ ] The home page includes site-level meta tags: title tag, meta description, og:title, og:description from Site configuration.
- [ ] Category and tag listing pages include appropriate title tags incorporating the category or tag name.
- [ ] og:image falls back to a site-level default image (from Site config) when an article has no illustration.

**Dependencies:** Site R1 (site-level metadata). R2 (article metadata for per-article tags).

---

### R7: Markdown Rendering

**Description:** Article markdown bodies are rendered to HTML. The renderer supports standard markdown constructs and sanitizes any raw HTML to prevent cross-site scripting.

**Acceptance Criteria:**

- [ ] The following markdown constructs render correctly to HTML: headings (h1-h6), bold, italic, links, ordered lists, unordered lists, code blocks (fenced), inline code, blockquotes, and images.
- [ ] Raw HTML embedded in markdown is sanitized — script tags and event handler attributes are stripped.
- [ ] Links in rendered markdown are functional and preserve their href values.
- [ ] Images in rendered markdown display with their alt text preserved.
- [ ] Code blocks preserve whitespace and formatting.

**Dependencies:** None.

## Out of Scope

- Article creation or editing UI.
- Image upload or asset management.
- Draft/publish workflow or article states.
- Scheduled or deferred publishing.
- Pagination of listing pages (may be added in a future iteration).

## Cross-References

- Depends on **Site** (cavekit-site.md): category definitions (R2), site metadata for SEO and RSS (R1).
- Depends on **Vault** (cavekit-vault.md): paywall rules determine RSS content gating (R5).
- Consumed by **Vault** (cavekit-vault.md): article date and frontmatter drive paywall decisions.
- Consumed by **Community** (cavekit-community.md): articles are the context for comments.
