import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { Layout } from "@/components/shared/Layout";
import Home from "@/pages/Home";
import { useEffect } from "react";
import { safeStorage } from "@/lib/storage";
import BeariWidget from "./components/beari/BeariWidget";
import { fetchPublicAssistantConfig } from "@/lib/api";
import { ADMIN_ROUTE } from "@/lib/admin-route";

const Admin = lazy(() => import("@/admin/Admin"));
const ProjectPage = lazy(() => import("@/pages/ProjectPage").then((module) => ({ default: module.ProjectPage })));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage").then((module) => ({ default: module.ProjectsPage })));
const BlogIndex = lazy(() => import("@/pages/blog").then((module) => ({ default: module.BlogIndex })));
const PostPage = lazy(() => import("@/pages/postPage").then((module) => ({ default: module.PostPage })));
const NotFound = lazy(() => import("@/pages/404").then((module) => ({ default: module.NotFound })));
const ServicesPage = lazy(() => import("@/pages/ServicesPage").then((module) => ({ default: module.ServicesPage })));
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } });

// clean browser URLs in production (see vercel.json rewrites).
const Router = import.meta.env.VITE_ROUTER === "hash" ? HashRouter : BrowserRouter;

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

function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (pathname === ADMIN_ROUTE) return <Suspense fallback={null}>{children}</Suspense>;
  return <Layout><Suspense fallback={<div className="min-h-[60vh]" />}>{children}</Suspense></Layout>;
}

function PublicBeariWidget() {
  const { pathname } = useLocation();
  const isAdmin = pathname === ADMIN_ROUTE;
  const config = useQuery({ queryKey: ["public-assistant-config"], queryFn: fetchPublicAssistantConfig, staleTime: 60_000, retry: false, enabled: !isAdmin });
  if (isAdmin || config.data?.enabled === false) return null;
  return <BeariWidget greeting={config.data?.greeting} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <Router>
            <AnalyticsTracker />
            <Shell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:slug" element={<ProjectPage />} />
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/:slug" element={<PostPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path={ADMIN_ROUTE} element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <PublicBeariWidget />
            </Shell>
          </Router>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
