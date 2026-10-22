import { lazy, Suspense, useEffect, useState } from "react";
import { Outlet, useLoaderData, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { ClientOnly } from "vite-react-ssg";
import { ModalProvider } from "@/contexts/ModalContext";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { Layout } from "@/components/shared/Layout";
import BeariWidget from "@/components/beari/BeariWidget";
import { fetchPublicAssistantConfig } from "@/lib/api";
import { ADMIN_ROUTE } from "@/lib/admin-route";
import { safeStorage } from "@/lib/storage";
import type { Project, Post, Skill, Service } from "@/lib/types";
import type { RouteRecord } from "vite-react-ssg";
import { SEO } from "@/lib/seo";

const ADMIN_PATH = ADMIN_ROUTE || "/admin";

type BuildContent = {
  projects: Project[];
  posts: Post[];
  skills: Skill[];
  services: Service[];
  settings: Record<string, unknown>;
};

async function readBuildContent({ request }: { request?: Request } = {}): Promise<BuildContent> {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const { cwd } = await import("node:process");
  const content = JSON.parse(await readFile(resolve(cwd(), ".seo-build-content.json"), "utf8")) as BuildContent;
  const pathname = request ? new URL(request.url).pathname : "/";
  const pageData: BuildContent = { projects: [], posts: [], skills: [], services: [], settings: {} };
  if (pathname === "/") return content;
  if (pathname === "/projects" || pathname.startsWith("/projects/")) pageData.projects = content.projects;
  if (pathname === "/blog") pageData.posts = content.posts;
  if (pathname.startsWith("/blog/")) {
    const slug = decodeURIComponent(pathname.slice("/blog/".length));
    pageData.posts = content.posts.filter((post) => post.slug === slug);
  }
  if (pathname === "/services") pageData.services = content.services;
  if (pathname === ADMIN_PATH) pageData.settings = content.settings;
  return pageData;
}

async function getSlugs(table: "projects" | "posts") {
  const content = await readBuildContent();
  return content[table].map((entry) => entry.slug);
}

function AnalyticsTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === ADMIN_ROUTE || navigator.doNotTrack === "1" || safeStorage.get("portfolio-analytics-opt-out") === "true") return;
    let visitorId = safeStorage.get("site-visitor-id");
    if (!visitorId) { visitorId = crypto.randomUUID(); safeStorage.set("site-visitor-id", visitorId); }
    const width = window.innerWidth;
    const deviceType = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
    void fetch("/api/analytics/page-view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visitorId, path: pathname.slice(0, 150), deviceType }), keepalive: true }).catch(() => undefined);
  }, [pathname]);
  return null;
}

function AppProviders() {
  const initial = useLoaderData() as BuildContent;
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } }));
  queryClient.setQueryData(["projects"], initial.projects);
  queryClient.setQueryData(["posts"], initial.posts);
  queryClient.setQueryData(["skills"], initial.skills);
  queryClient.setQueryData(["services"], initial.services);
  queryClient.setQueryData(["site-settings"], initial.settings);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <ModalProvider>
            <AppShell />
          </ModalProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = pathname === ADMIN_PATH;
  return (
    <>
      <AnalyticsTracker />
      {isAdmin ? <><SEO title="Admin | Tafa Belli Brown" description="Private portfolio administration." path={pathname} robots="noindex, nofollow" /><h1 className="sr-only">Private portfolio administration</h1><Suspense fallback={null}><Outlet /></Suspense></> : <Layout><Suspense fallback={<div className="min-h-[60vh]" />}><Outlet /></Suspense></Layout>}
      {!isAdmin && <ClientOnly>{() => <PublicBeariWidget />}</ClientOnly>}
    </>
  );
}

function PublicBeariWidget() {
  const assistant = useQuery({ queryKey: ["public-assistant-config"], queryFn: fetchPublicAssistantConfig, staleTime: 60_000, retry: false });
  if (assistant.data?.enabled === false) return null;
  return <BeariWidget greeting={assistant.data?.greeting} />;
}

const Home = lazy(() => import("@/pages/Home"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage").then((module) => ({ default: module.ProjectsPage })));
const ProjectPage = lazy(() => import("@/pages/ProjectPage").then((module) => ({ default: module.ProjectPage })));
const BlogIndex = lazy(() => import("@/pages/blog").then((module) => ({ default: module.BlogIndex })));
const PostPage = lazy(() => import("@/pages/postPage").then((module) => ({ default: module.PostPage })));
const ServicesPage = lazy(() => import("@/pages/ServicesPage").then((module) => ({ default: module.ServicesPage })));
const NotFound = lazy(() => import("@/pages/404").then((module) => ({ default: module.NotFound })));
const Admin = lazy(() => import("@/admin/Admin"));

export const routes: RouteRecord[] = [
  {
    id: "root",
    path: "/",
    Component: AppProviders,
    loader: readBuildContent,
    children: [
      { index: true, Component: Home },
      { path: "projects", Component: ProjectsPage },
      { path: "projects/:slug", Component: ProjectPage, getStaticPaths: async () => (await getSlugs("projects")).map((slug) => `projects/${slug}`) },
      { path: "blog", Component: BlogIndex },
      { path: "blog/:slug", Component: PostPage, getStaticPaths: async () => (await getSlugs("posts")).map((slug) => `blog/${slug}`) },
      { path: "services", Component: ServicesPage },
      { path: ADMIN_PATH.replace(/^\//, ""), Component: Admin, getStaticPaths: () => [ADMIN_PATH.replace(/^\//, "")] },
      { path: "404", Component: NotFound },
      { path: "*", Component: NotFound },
    ],
  },
];
