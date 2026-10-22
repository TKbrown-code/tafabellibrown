import { copyFile, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(projectRoot, "dist");
const content = JSON.parse(await readFile(resolve(projectRoot, ".seo-build-content.json"), "utf8"));
const origin = content.canonicalOrigin;
const adminRoute = `/${String(content.adminRoute || "/admin").replace(/^\/+/, "")}`;
const today = new Date().toISOString().slice(0, 10);

function validLastmod(value) {
  if (!value) return today;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? today : date.toISOString().slice(0, 10);
}

const urls = [
  { path: "/", lastmod: today, priority: "1.0" },
  { path: "/projects", lastmod: today, priority: "0.9" },
  { path: "/blog", lastmod: content.posts[0]?.updated_at || content.posts[0]?.published_at || today, priority: "0.8" },
  { path: "/services", lastmod: content.services[0]?.updated_at || content.services[0]?.created_at || today, priority: "0.8" },
  ...content.projects.map((item) => ({
    path: `/projects/${encodeURIComponent(item.slug)}`,
    lastmod: item.updated_at || item.created_at || today,
    priority: "0.8",
  })),
  ...content.posts.map((item) => ({
    path: `/blog/${encodeURIComponent(item.slug)}`,
    lastmod: item.updated_at || item.published_at || today,
    priority: "0.7",
  })),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(({ path, lastmod, priority }) => `  <url><loc>${origin}${path}</loc><lastmod>${validLastmod(lastmod)}</lastmod><priority>${priority}</priority></url>`),
  '</urlset>',
  '',
].join("\n");
await writeFile(resolve(dist, "sitemap.xml"), sitemap, "utf8");
const discoveryAgents = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"];
const robots = [
  "User-agent: *",
  "Allow: /",
  `Disallow: ${adminRoute}`,
  ...discoveryAgents.flatMap((agent) => ["", `User-agent: ${agent}`, "Allow: /", `Disallow: ${adminRoute}`]),
  "",
  `Sitemap: ${origin}/sitemap.xml`,
  "",
].join("\n");
await writeFile(resolve(dist, "robots.txt"), robots, "utf8");

const link = (path, label) => `- [${label}](${origin}${path})`;
const clean = (value) => String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
const llms = [
  "# Tafa Belli Brown",
  "",
  "> Portfolio of Tafa Belli Brown, a full-stack web developer building production web applications with React, TypeScript, Node.js, and PostgreSQL.",
  "",
  "## Main pages",
  "",
  link("/", "Home: profile, skills, experience, and contact information"),
  link("/projects", "Projects and engineering case studies"),
  link("/blog", "Technical articles and development notes"),
  link("/services", "Web development services"),
  "",
  "## Projects",
  "",
  ...content.projects.map((item) => `${link(`/projects/${encodeURIComponent(item.slug)}`, clean(item.title))}${item.description ? ` — ${clean(item.description)}` : ""}`),
  "",
  "## Articles",
  "",
  ...content.posts.map((item) => `${link(`/blog/${encodeURIComponent(item.slug)}`, clean(item.title))}${item.excerpt ? ` — ${clean(item.excerpt)}` : ""}`),
  "",
  "## Optional",
  "",
  `- [XML sitemap](${origin}/sitemap.xml)`,
  "",
].join("\n");
await writeFile(resolve(dist, "llms.txt"), llms, "utf8");

const titles = new Set();
const descriptions = new Set();
for (const { path: routePath } of urls) {
  const htmlPath = routePath === "/" ? resolve(dist, "index.html") : resolve(dist, routePath.slice(1), "index.html");
  const html = await readFile(htmlPath, "utf8");
  const title = html.match(/<title[^>]*>(.*?)<\/title>/)?.[1]?.trim();
  const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1]?.trim();
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/)?.[1];
  const h1Count = (html.match(/<h1\b/g) || []).length;
  if (!title || title.length >= 60) throw new Error(`SEO title is missing or too long on ${routePath}.`);
  if (!description || description.length >= 160) throw new Error(`SEO description is missing or too long on ${routePath}.`);
  if (titles.has(title)) throw new Error(`Duplicate SEO title emitted: ${title}`);
  if (descriptions.has(description)) throw new Error(`Duplicate SEO description emitted on ${routePath}.`);
  if (canonical !== `${origin}${routePath}`) throw new Error(`Canonical URL is missing or incorrect on ${routePath}.`);
  if (h1Count !== 1) throw new Error(`Expected exactly one h1 on ${routePath}; found ${h1Count}.`);
  for (const match of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    JSON.parse(match[1]);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(match[0]) || !/\bwidth=/.test(match[0]) || !/\bheight=/.test(match[0])) {
      throw new Error(`An image is missing alt text or intrinsic dimensions on ${routePath}.`);
    }
  }
  titles.add(title);
  descriptions.add(description);
}
console.log(`Validated ${urls.length} unique SEO pages: titles, descriptions, canonicals, h1, JSON-LD, and image dimensions.`);

// Vercel serves this file with an HTTP 404 status when a requested path is missing.
await copyFile(resolve(dist, "404", "index.html"), resolve(dist, "404.html"));
console.log(`Generated sitemap.xml with ${urls.length} public routes and a prerendered 404.html.`);
await unlink(resolve(projectRoot, ".seo-build-content.json"));
