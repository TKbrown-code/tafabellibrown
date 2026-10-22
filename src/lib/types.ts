export type TranslationSuffix = "fr" | "zh" | "es" | "ar" | "pcm";
type LocalizedColumns<Fields extends string> = { [Key in `${Fields}_${TranslationSuffix}`]?: string | null };
export type Metric = { value: string; label: string } & LocalizedColumns<"label">;
export type CodeSnippet = { title: string; language: string; code: string } & LocalizedColumns<"title">;

export type Project = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  role: string;
  year: string;
  problem: string;
  approach: string;
  results: string;
  metrics: Metric[];
  tech: string[];
  live_url?: string | null;
  repo_url?: string | null;
  cover_url?: string | null;
  code_snippets?: CodeSnippet[];
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
} & LocalizedColumns<"title" | "tagline" | "summary" | "role" | "problem" | "approach" | "results">;

export type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  cover_url?: string | null;
  reading_minutes: number;
  published: boolean;
  published_at: string | null;
  created_at?: string;
  updated_at?: string;
} & LocalizedColumns<"title" | "excerpt" | "content">;

export type SkillCategory = "frontend" | "backend" | "data" | "devops" | "testing";

export type Skill = { id: string; category: SkillCategory; name: string; sort_order: number; is_primary?: boolean };

export type Service = {
  id: string;
  category: string;
  category_fr?: string | null; category_zh?: string | null; category_es?: string | null; category_ar?: string | null; category_pcm?: string | null;
  subcategory: string;
  subcategory_fr?: string | null; subcategory_zh?: string | null; subcategory_es?: string | null; subcategory_ar?: string | null; subcategory_pcm?: string | null;
  title: string;
  title_fr?: string | null; title_zh?: string | null; title_es?: string | null; title_ar?: string | null; title_pcm?: string | null;
  description: string;
  description_fr?: string | null; description_zh?: string | null; description_es?: string | null; description_ar?: string | null; description_pcm?: string | null;
  screenshot_path: string | null;
  screenshot_url?: string | null;
  screenshot_alt: string;
  screenshot_alt_fr?: string | null; screenshot_alt_zh?: string | null; screenshot_alt_es?: string | null; screenshot_alt_ar?: string | null; screenshot_alt_pcm?: string | null;
  sort_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Message = {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
};

export type NewMessage = Pick<Message, "name" | "email" | "subject" | "body">;
