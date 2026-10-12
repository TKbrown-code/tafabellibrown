export type Metric = { value: string; label: string; label_zh?: string | null };

export type Project = {
  id: string;
  slug: string;
  title: string;
  title_zh?: string | null;
  tagline: string;
  tagline_zh?: string | null;
  summary: string;
  summary_zh?: string | null;
  role: string;
  role_zh?: string | null;
  year: string;
  problem: string;
  problem_zh?: string | null;
  approach: string;
  approach_zh?: string | null;
  results: string;
  results_zh?: string | null;
  metrics: Metric[];
  tech: string[];
  live_url?: string | null;
  repo_url?: string | null;
  cover_url?: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
};

export type Post = {
  id: string;
  slug: string;
  title: string;
  title_zh?: string | null;
  excerpt: string;
  excerpt_zh?: string | null;
  content: string;
  content_zh?: string | null;
  tags: string[];
  cover_url?: string | null;
  reading_minutes: number;
  published: boolean;
  published_at: string | null;
};

export type SkillCategory = "frontend" | "backend" | "data" | "devops" | "testing";

export type Skill = { id: string; category: SkillCategory; name: string; sort_order: number };

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
