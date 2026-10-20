# Portfolio frontend

The frontend is a responsive, multilingual portfolio and admin dashboard built with React 18, TypeScript, Vite, Tailwind CSS v4, React Router, and TanStack Query. It is a browser client: trusted database operations, provider credentials, and email delivery belong to the backend API.

## Features

- Public portfolio pages for projects, services, and blog posts, with localized content and page metadata.
- Responsive home-page sections, including a profile-photo hero and contact form with Turnstile verification.
- Beari assistant chat for visitors and authenticated admins.
- Admin tools for portfolio content, messages, notifications, analytics, résumé editing, and site settings.
- Admin Beari chat supports image attachments. JPG, PNG, and WebP images (up to 4 MB) are stored in a private Supabase Storage bucket, and authenticated chat history can reopen them. Apply the backend migration documented in `../backend/README.md` before enabling image uploads.

## Local development

```powershell
cd portfolio
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api` to `http://localhost:5000`. Set `VITE_API_PROXY_TARGET` to point at another API during development.

Build and type-check with:

```powershell
npm run build
```

For a static preview, run `npm run preview` after building. `npm run build:preview` builds the optional hash-router variant.

## Routes

| Path | Page |
| --- | --- |
| `/` | Home page and portfolio sections |
| `/projects` | Project collection |
| `/projects/:slug` | Project case study |
| `/services` | Services listing |
| `/blog` | Published posts |
| `/blog/:slug` | Blog post |
| Admin workspace path | Authenticated CMS dashboard (configured in `src/lib/admin-route.ts`) |

The frontend uses clean browser URLs by default. `vercel.json` contains production rewrite support. `VITE_ROUTER=hash` switches to a hash router for hosts that do not provide SPA rewrites.

The repository overview remains in the root `README.md`; backend setup and API operations are documented in `../backend/README.md`.

## Application structure

```text
src/App.tsx                      Providers, router, route-level lazy loading
src/pages/                       Project, service, blog, and not-found pages
src/sections/home/               Home page sections
src/components/shared/           Layout, accessible shared presentation
src/components/beari/            Visitor assistant widget, chat, and mascot
src/admin/Admin.tsx              Admin shell, navigation, auth-gated panels
src/admin/ContentPanels.tsx      Projects, posts, services, and skills editing
src/admin/CommunicationPanels.tsx Messages, email, and notifications
src/admin/DashboardPanels.tsx    Overview, calendar, and admin management
src/admin/ResumeAndBeariPanels.tsx Résumé tools and Beari settings
src/admin/AdminChat.tsx          Shared chat UI, image preview, and chat controls
src/lib/api.ts                   Typed HTTP client and API operations
src/lib/i18n.tsx                 Locale selection and translation helpers
src/lib/theme.tsx                Theme state
src/index.css                    Design tokens, typography, and global styles
```

## Data flow and configuration

- API calls use the Axios clients in `src/lib/api.ts` and target the same-origin `/api` prefix.
- Admin pages authenticate through the API; the browser does not receive a Supabase service-role or secret key.
- Admin chat images use authenticated backend upload and read endpoints. Do not replace these with public URLs or expose storage credentials in the browser.
- Public and admin content comes from the backend. Local seed data is a development/fallback source for selected portfolio data, not the production content store.
- Supported locales are English, French, Chinese, Spanish, Arabic, and Nigerian Pidgin. Locale-specific content is selected through the shared i18n helpers.
- Theme colors and typography are CSS custom properties in `src/index.css`; the dark theme uses the same token names with adjusted values.
- Configure `VITE_TURNSTILE_SITE_KEY` for the admin sign-in widget. Only public browser-safe values should use the `VITE_` prefix.

## Editing guidance

- Keep reusable API behavior in `src/lib/api.ts` and display components in `src/components/`.
- Prefer existing design tokens and shared `input`, `btn`, `card`, `label`, and typography utilities over one-off styles.
- Keep visitor-facing claims grounded in published portfolio data.
- Use semantic labels and accessible names for form controls and icon-only buttons.
- Admin-generated text suggestions should remain reviewable and must not silently overwrite content.
- Avoid adding provider secrets or server-only logic to this package.

## Deployment

Deploy this folder to Vercel with `npm run build` and `dist` as the output directory. Set the frontend’s production API routing/environment as appropriate for the deployment. Backend deployment and database setup are documented in `../backend/README.md`.

## License

This frontend is distributed under the MIT License. See [`LICENSE`](./LICENSE) for the copyright notice and license terms.
