import { BrowserRouter, HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";

const Admin = lazy(() => import("@/admin/Admin"));
const content = () => import("@/pages/Content");
const ProjectPage = lazy(() => content().then((m) => ({ default: m.ProjectPage })));
const BlogIndex = lazy(() => content().then((m) => ({ default: m.BlogIndex })));
const PostPage = lazy(() => content().then((m) => ({ default: m.PostPage })));
const NotFound = lazy(() => content().then((m) => ({ default: m.NotFound })));
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } });

// Hash routing for sandboxed previews; clean browser URLs in production (see vercel.json rewrites).
const Router = import.meta.env.VITE_ROUTER === "hash" ? HashRouter : BrowserRouter;

function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return <Suspense fallback={null}>{children}</Suspense>;
  return <Layout><Suspense fallback={<div className="min-h-[60vh]" />}>{children}</Suspense></Layout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <Router>
            <Shell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects/:slug" element={<ProjectPage />} />
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/:slug" element={<PostPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Shell>
          </Router>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
