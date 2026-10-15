# Tafa Belli Brown — Portfolio

Personal portfolio and CMS built with **React + TypeScript (Vite)**, **Tailwind CSS** and **Supabase**.

## Features

- Single-page home: Hero, About, Skills, Projects, Experience, Blog, Contact
- Case-study page per project (`/projects/:slug`) and a blog (`/blog`, `/blog/:slug`) written in Markdown
- English / 中文 language toggle (UI strings and all content fields)
- Light / dark theme (follows the system, remembers your choice)
- Downloadable résumé (`public/resume`)
- Contact form → stored in Supabase `messages`
- Admin CMS at `/admin` (Supabase Auth): inbox, projects, blog posts, skills
- **Demo mode**: with no Supabase env vars, the site runs on seed data in memory (admin password: `demo`)

## Stack

| Layer    | Choice |
| -------- | ------ |
| UI       | React 18, TypeScript, Tailwind CSS 3, Framer Motion, lucide-react |
| Data     | Supabase (Postgres + Auth + RLS) via `@supabase/supabase-js`, TanStack Query |
| Routing  | React Router (browser routing in production, hash routing for sandboxed previews) |
| Hosting  | Vercel (`vercel.json` rewrites all routes to `index.html`) |

## Project structure

```
src/
  data/site.ts      ← profile, experience, education (edit directly)
  data/seed.ts      ← default projects, posts, skills (demo mode + seed.sql source)
  lib/api.ts        ← data layer: Supabase or in-memory demo store
  lib/i18n.tsx      ← EN/中文 dictionary + language context
  lib/theme.tsx     ← light/dark theme
  pages/Home.tsx    ← all home sections
  pages/Content.tsx ← case study, blog index, blog post, 404
  admin/Admin.tsx   ← CMS (login, messages, projects, posts, skills)
supabase/
  schema.sql        ← tables + row-level security
  seed.sql          ← generated from src/data/seed.ts (npm run seed:sql)
```

## Run locally

```bash
npm install
cp .env.example .env.local   # optional — leave empty to use demo mode
npm run dev
```

## Connect Supabase

1. Create a project at supabase.com.
2. SQL Editor → run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Authentication → Users → **Add user** with your email and password. Under Authentication → Providers → Email, turn off **Allow new users to sign up**.
4. Make yourself admin:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'email@gmail.com';
   ```
5. Project Settings → API → copy the URL and `anon` key into `.env.local`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```

The anon key is safe in the browser — row-level security only lets the public read published content and insert messages. Everything else requires a signed-in admin.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework: Vite).
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
3. Deploy. Build command `npm run build`, output `dist`.

## To-do before launch

- Add your GitHub and LinkedIn URLs in `src/data/site.ts` (icons appear automatically).
- Review the two starter blog posts in `/admin` → Blog and edit them in your own voice.
- Optional: add a profile photo, custom domain, and Supabase email notifications (Database Webhook → Edge Function) for new messages.
