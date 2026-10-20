import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowLeft, Bot, CalendarDays, Clock3, FileText, FolderKanban, ImagePlus, Inbox, LayoutDashboard, Loader2, LogOut, Settings, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { ThemeToggle, useTitle } from "@/components/shared/Layout";
import { fetchAdminApiLogs, fetchAdminNotifications, fetchCurrentAdmin, markAdminNotificationRead, markAllAdminNotificationsRead } from "@/lib/api";
import { Logo } from "@/components/shared/ui";
import { defaultSiteSettings, useSiteSettings } from "@/lib/site-settings";
import { AdminsPanel, CalendarPanel, OverviewPanel } from "./DashboardPanels";
import { AdminNotification, NotificationsMenu, MessagesPanel } from "./CommunicationPanels";
import { ApiLogsPanel } from "./ApiLogsPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ProjectsPanel, PostsPanel, ServicesPanel, SkillsPanel } from "./ContentPanels";
import { AdminAssistantPanel, BeariSettingsPanel, ResumePanel } from "./ResumeAndBeariPanels";
import { ProfilePanel } from "./ProfilePanel";
import { BlogAutomationPanel } from "./BlogAutomationPanel";
import { safeStorage } from "@/lib/storage";
import "./admin-chat.css";
import { Login, useAuth, type Tab } from "./shared";

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 248;
const SIDEBAR_WIDTH_KEY = "admin-sidebar-width";

export default function Admin() {
  useTitle("Admin dashboard", "Private portfolio administration.", {
    noIndex: true,
  });

  const auth = useAuth();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const { data: profileSettings = defaultSiteSettings } = useSiteSettings();
  const authUserId = auth.user && "id" in auth.user ? auth.user.id : null;
  const adminProfile = useQuery({
    queryKey: ["current-admin", authUserId],
    enabled: Boolean(authUserId),
    queryFn: fetchCurrentAdmin,
  });
  const isSuperAdmin = adminProfile.data?.role === "superAdmin";
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = Number(safeStorage.get(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(savedWidth) && savedWidth >= SIDEBAR_MIN_WIDTH && savedWidth <= SIDEBAR_MAX_WIDTH
      ? savedWidth
      : SIDEBAR_DEFAULT_WIDTH;
  });
  const [resizingSidebar, setResizingSidebar] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [apiLogsLive, setApiLogsLive] = useState(false);
  const notificationsQuery = useInfiniteQuery({
    queryKey: ["admin-notifications"],
    enabled: Boolean(auth.user),
    queryFn: ({ pageParam }) => fetchAdminNotifications(pageParam ?? undefined),
    initialPageParam: null as { updatedAt: string; id: string } | null,
    getNextPageParam: (lastPage) => {
      if (lastPage.length !== 50) return undefined;
      const lastNotification = lastPage[lastPage.length - 1] as AdminNotification;
      return { updatedAt: lastNotification.updated_at, id: lastNotification.id };
    },
    refetchInterval: 60_000,
  });
  const apiLogsQuery = useInfiniteQuery({
    queryKey: ["admin-api-logs"],
    enabled: Boolean(auth.user) && tab === "api-logs",
    queryFn: ({ pageParam }) => fetchAdminApiLogs(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 100 ? pages.length * 100 : undefined,
    refetchInterval: tab === "api-logs" ? 30_000 : false,
  });
  const notifications = [...new Map((notificationsQuery.data?.pages.flat() ?? []).map((notification: AdminNotification) => [notification.id, notification])).values()];
  const menuNotifications = notifications.slice(0, 50);
  const unread = notifications.reduce((count, notification) => count + (notification.read_at ? 0 : 1), 0);
  useEffect(() => {
    if (!auth.user) return;
    const events = new EventSource("/api/admin/notifications/stream", { withCredentials: true });
    events.addEventListener("ready", () => setRealtimeConnected(true));
    events.addEventListener("update", (event) => {
      const category = (JSON.parse((event as MessageEvent).data) as { category?: string | null }).category;
      void qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      if (category === "message") void qc.invalidateQueries({ queryKey: ["admin", "messages"] });
    });
    events.onerror = () => setRealtimeConnected(false);
    return () => {
      setRealtimeConnected(false);
      events.close();
    };
  }, [auth.user, qc]);
  useEffect(() => {
    if (!auth.user || tab !== "api-logs") {
      setApiLogsLive(false);
      return;
    }

    const events = new EventSource("/api/admin/logs/stream", { withCredentials: true });
    events.addEventListener("ready", () => setApiLogsLive(true));
    events.addEventListener("update", () => {
      void qc.invalidateQueries({ queryKey: ["admin-api-logs"] });
    });
    events.addEventListener("unavailable", () => setApiLogsLive(false));
    events.onerror = () => setApiLogsLive(false);

    return () => {
      setApiLogsLive(false);
      events.close();
    };
  }, [auth.user, qc, tab]);
  const selectNotification = (notification: AdminNotification) => {
    if (notification.id) {
      void markAdminNotificationRead(notification.id).finally(() => void qc.invalidateQueries({ queryKey: ["admin-notifications"] }));
    }
    if (notification.category === "message") {
      void qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      setSelectedMessageId(notification.target_id || null);
      setTab("messages");
    } else {
      setTab("overview");
    }
  };
  const markAllNotificationsRead = () => {
    void markAllAdminNotificationsRead().finally(() => void qc.invalidateQueries({ queryKey: ["admin-notifications"] }));
  };
  useEffect(() => {
    safeStorage.set(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);
  const resizeSidebar = (clientX: number) => {
    const bounds = layoutRef.current?.getBoundingClientRect();
    if (bounds) {
      setSidebarWidth(Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, Math.round(clientX - bounds.left))));
    }
  };
  const chatActive = tab === "beari-chat";
  useEffect(() => { document.title = "Admin | Tafa Belli Brown"; }, []);

  if (!auth.ready) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-faint" /></div>;
  if (!auth.user) return <Login onSignIn={auth.signIn} onRequestSignInLink={auth.requestSignInLink} />;

  const navSections: { label: string; tabs: { id: Tab; label: string; icon: ReactNode }[] }[] = [
    { label: "Workspace", tabs: [
      { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "calendar", label: "Calendar", icon: <CalendarDays className="h-4 w-4" /> },
      { id: "messages", label: "Messages", icon: <Inbox className="h-4 w-4" /> },
      { id: "api-logs", label: "API logs", icon: <Activity className="h-4 w-4" /> },
    ] },
    { label: "Portfolio", tabs: [
      { id: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
      { id: "posts", label: "Blog", icon: <FileText className="h-4 w-4" /> },
      ...(isSuperAdmin ? [{ id: "blog-schedule" as const, label: "Blog schedule", icon: <Clock3 className="h-4 w-4" /> }] : []),
      { id: "services", label: "Services", icon: <ImagePlus className="h-4 w-4" /> },
      { id: "skills", label: "Skills", icon: <Sparkles className="h-4 w-4" /> },
    ] },
    { label: "Assistant & tools", tabs: [
      { id: "beari-chat", label: "Beari chat", icon: <Bot className="h-4 w-4" /> },
      { id: "resume", label: "Résumé studio", icon: <FileText className="h-4 w-4" /> },
    ] },
    { label: "Settings & access", tabs: [
      { id: "profile", label: "My profile", icon: <UserRound className="h-4 w-4" /> },
      { id: "settings", label: "Site settings", icon: <Settings className="h-4 w-4" /> },
      { id: "beari-settings", label: "Beari settings", icon: <Settings className="h-4 w-4" /> },
      { id: "admins", label: "Admins", icon: <ShieldCheck className="h-4 w-4" /> },
    ] },
  ];

  return (
    <div ref={layoutRef} style={{ "--admin-sidebar-width": `${sidebarWidth}px` } as CSSProperties} className={`${theme === "dark" ? "dark" : ""} ${chatActive ? "grid h-dvh min-h-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden md:grid-rows-[minmax(0,1fr)]" : "min-h-screen"} bg-bg text-ink md:grid md:grid-cols-[var(--admin-sidebar-width)_minmax(0,1fr)]`}>
      <aside className="relative border-b border-border bg-surface md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center gap-2.5 px-5 py-5"><Logo className="h-7 w-7" /><div><p className="text-sm font-bold leading-tight">Portfolio CMS</p><p className="text-[11px] text-muted">Connected API</p></div></div>
        <nav className="admin-nav-scroll flex gap-1 overflow-x-auto px-3 pb-3 md:max-h-[calc(100vh-10rem)] md:flex-col md:gap-0 md:overflow-y-auto md:pb-6" aria-label="Admin navigation">
          {navSections.map((section, index) => (
            <div key={section.label} className={`contents md:block md:space-y-1 ${index ? "md:mt-4" : ""}`}>
              <p className="hidden px-3 pb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-faint md:block">{section.label}</p>
              {section.tabs.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors md:w-full ${tab === t.id ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          ))}
          <button onClick={auth.signOut} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted md:hidden"><LogOut className="h-4 w-4" /> Sign out</button>
        </nav>
        <div className="hidden px-3 md:absolute md:bottom-4 md:left-0 md:right-0 md:block">
          <p className="truncate px-3 pb-2 text-[11px] text-faint">{auth.user.email}</p>
          <div className="flex items-center gap-2 px-1">
            <button onClick={auth.signOut} className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink" aria-label="Sign out" data-testid="button-signout"><LogOut className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        <div
          role="separator"
          aria-label="Resize admin sidebar"
          aria-orientation="vertical"
          aria-valuemin={SIDEBAR_MIN_WIDTH}
          aria-valuemax={SIDEBAR_MAX_WIDTH}
          aria-valuenow={sidebarWidth}
          tabIndex={0}
          className={`group absolute -right-1 top-0 z-10 hidden h-full w-2 cursor-col-resize touch-none items-center justify-center outline-none transition-colors hover:bg-accent/20 focus-visible:bg-accent/20 md:flex ${resizingSidebar ? "bg-accent/25" : ""}`}
          onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setResizingSidebar(true);
            resizeSidebar(event.clientX);
          }}
          onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
            if (resizingSidebar) resizeSidebar(event.clientX);
          }}
          onPointerUp={() => setResizingSidebar(false)}
          onPointerCancel={() => setResizingSidebar(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setSidebarWidth((width) => Math.max(SIDEBAR_MIN_WIDTH, width - 16));
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              setSidebarWidth((width) => Math.min(SIDEBAR_MAX_WIDTH, width + 16));
            }
          }}
        >
          <span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-accent group-focus-visible:bg-accent" />
        </div>
      </aside>
      <main className={`mx-auto w-full ${chatActive ? "h-full min-h-0 min-w-0 max-w-none overflow-hidden px-5 py-4 md:px-10 md:py-4" : "max-w-7xl px-5 py-8 md:px-10 md:py-10"} ${chatActive ? "flex flex-col" : ""}`}>
        <div className={`${chatActive ? "mb-3 shrink-0 pb-3" : "mb-8 pb-5"} flex flex-wrap items-center justify-between gap-3 border-b border-border`}><div><p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">Portfolio control center</p><p className="mt-1 text-sm text-muted">Welcome back, {adminProfile.data?.name || auth.user.email || "Admin"}</p></div><div className="flex items-center gap-2"><Link to="/" aria-label="Home" className="btn-ghost btn-sm" data-testid="link-admin-home"><ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Home</span></Link><NotificationsMenu notifications={menuNotifications} unreadCount={unread} isLive={realtimeConnected} hasError={notificationsQuery.isError} onSelect={selectNotification} onMarkAll={markAllNotificationsRead} /><ThemeToggle /><button type="button" onClick={() => setTab("profile")} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Open my profile" title="My profile"><img src={profileSettings.profileImageUrl} alt="My profile" className="h-9 w-9 rounded-full border border-border object-cover" /></button></div></div>
        {tab === "overview" && <OverviewPanel notifications={notifications} onLoadMoreActivities={() => void notificationsQuery.fetchNextPage()} hasMoreActivities={Boolean(notificationsQuery.hasNextPage)} isLoadingMoreActivities={notificationsQuery.isFetchingNextPage} onOpenCalendar={() => setTab("calendar")} onOpenApiLogs={() => setTab("api-logs")} onSelectActivity={selectNotification} />}
        {tab === "calendar" && <CalendarPanel adminEmail={auth.user.email ?? ""} />}
        {tab === "settings" && <SettingsPanel />}
        {tab === "profile" && <ProfilePanel profile={adminProfile.data} onProfileUpdated={(updated) => { qc.setQueryData(["current-admin", authUserId], updated); void qc.invalidateQueries({ queryKey: ["current-admin"] }); }} />}
        {tab === "messages" && <MessagesPanel initialMessageId={selectedMessageId} />}
        {tab === "api-logs" && <ApiLogsPanel logs={[...new Map((apiLogsQuery.data?.pages.flat() ?? []).map((log) => [log.id, log])).values()]} isLive={apiLogsLive} isLoading={apiLogsQuery.isFetching} isLoadingMore={apiLogsQuery.isFetchingNextPage} hasMore={Boolean(apiLogsQuery.hasNextPage)} hasError={apiLogsQuery.isError} onRefresh={() => void apiLogsQuery.refetch()} onLoadMore={() => void apiLogsQuery.fetchNextPage()} />}
        {tab === "projects" && <ProjectsPanel />}
        {tab === "posts" && <PostsPanel />}
        {tab === "blog-schedule" && isSuperAdmin && <BlogAutomationPanel />}
        {tab === "skills" && <SkillsPanel />}
        {tab === "services" && <ServicesPanel />}
        {tab === "resume" && <ResumePanel />}
        {tab === "beari-chat" && <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden"><AdminAssistantPanel adminName={adminProfile.data?.name || "there"} adminId={authUserId ?? ""} /></div>}
        {tab === "beari-settings" && <BeariSettingsPanel adminId={authUserId ?? ""} />}
        {tab === "admins" && <AdminsPanel isSuperAdmin={isSuperAdmin} />}
      </main>
    </div>
  );
}
