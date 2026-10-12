// Generates supabase/seed.sql from src/data/seed.ts  →  npm run seed:sql
import { writeFileSync } from "node:fs";
import { seedPosts, seedProjects, seedSkills } from "../src/data/seed";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return `array[${v.map(q).join(", ")}]::text[]`;
  if (typeof v === "object") return `${q(JSON.stringify(v))}::jsonb`;
  return `'${String(v).replace(/'/g, "''")}'`;
};
const insert = (table: string, rows: Record<string, unknown>[], conflict?: string) => {
  const cols = Object.keys(rows[0]).filter((c) => c !== "id");
  const values = rows.map((r) => `(${cols.map((c) => q(r[c])).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values}${conflict ? `\non conflict (${conflict}) do nothing` : ""};\n`;
};
// Cover images: replace with your Supabase Storage / deployed URLs if you host them elsewhere.
const projects = seedProjects.map((p) => ({ ...p, cover_url: p.cover_url ? "/" + p.cover_url : null }));
const sql = `-- Seed content (generated). Run after schema.sql.\n\n${insert("projects", projects, "slug")}\n${insert("posts", seedPosts, "slug")}\n${insert("skills", seedSkills)}`;
writeFileSync("supabase/seed.sql", sql);
console.log("wrote supabase/seed.sql");
