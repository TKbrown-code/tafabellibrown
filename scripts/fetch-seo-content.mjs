import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_CANONICAL_ORIGIN } from "../seo-config.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envFiles = [".env", ".env.local", ".env.production", ".env.production.local"];

for (const file of envFiles) {
  try {
    const source = await readFile(resolve(projectRoot, file), "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

const configuredApi = process.env.SEO_API_BASE_URL || process.env.VITE_API_PROXY_TARGET || "https://tafabellibrown.onrender.com";
const apiUrl = new URL(configuredApi);
if (!apiUrl.pathname.replace(/\/$/, "").endsWith("/api")) {
  apiUrl.pathname = `${apiUrl.pathname.replace(/\/$/, "")}/api`;
}
apiUrl.search = "";
apiUrl.hash = "";
const base = apiUrl.toString().replace(/\/$/, "");

async function getData(path) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${path} returned HTTP ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload?.data) && (path.startsWith("/content/") || path === "/services/")) {
      throw new Error(`${path} did not return a data array`);
    }
    return payload?.data;
  } finally {
    clearTimeout(timeout);
  }
}

const required = [
  ["projects", "/content/projects"],
  ["posts", "/content/posts"],
  ["skills", "/content/skills"],
  ["services", "/services/"],
  ["settings", "/settings"],
];

const content = {};
for (const [key, path] of required) {
  try {
    content[key] = await getData(path);
  } catch (error) {
    throw new Error(`SEO prerender data fetch failed for ${path}: ${error.message}`, { cause: error });
  }
}
content.canonicalOrigin = (process.env.VITE_CANONICAL_ORIGIN || process.env.SEO_CANONICAL_ORIGIN || DEFAULT_CANONICAL_ORIGIN).replace(/\/$/, "");
content.adminRoute = process.env.VITE_ADMIN_ROUTE || "/admin";

for (const key of ["projects", "posts"]) {
  if (content[key].some((item) => typeof item?.slug !== "string" || !item.slug.trim())) {
    throw new Error(`SEO prerender data contains a ${key} entry without a valid slug.`);
  }
  if (content[key].length === 0) {
    throw new Error(`SEO prerender data contains no published ${key}. Refusing to create empty route pages.`);
  }
}
if (!content.settings || typeof content.settings !== "object" || Array.isArray(content.settings)) {
  throw new Error("SEO prerender data did not include the published site settings object.");
}

const output = resolve(projectRoot, ".seo-build-content.json");
await writeFile(output, `${JSON.stringify(content)}\n`, "utf8");
console.log(`Fetched SEO build data: ${content.projects.length} projects, ${content.posts.length} posts, ${content.services.length} services.`);
