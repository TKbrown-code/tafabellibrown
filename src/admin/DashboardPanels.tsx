import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowRight, BarChart3, Bot, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Cpu, MessageSquare, Pencil, Plus, Save, Server, ShieldCheck, Sparkles, Trash2, UserPlus, Users, X } from "lucide-react";
import { createCalendarTask, deleteAdminAccount, deleteCalendarTask, fetchAdminAccounts, fetchAdminAnalytics, fetchAdminApiMetrics, fetchAdminSystem, fetchCalendarTasks, getBeariEmailStatus, inviteAdminAccount, suggestCalendarTask, updateAdminAccount, updateCalendarTask, type AdminAccount, type CalendarTask } from "@/lib/api";
import type { AdminNotification } from "./CommunicationPanels";
import { Field, Panel } from "./shared";
import { safeStorage } from "@/lib/storage";
import { useModal } from "@/hooks/useModal";

export function OverviewPanel({ notifications, onLoadMoreActivities, hasMoreActivities, isLoadingMoreActivities, onOpenCalendar, onOpenApiLogs, onSelectActivity }: { notifications: AdminNotification[]; onLoadMoreActivities: () => void; hasMoreActivities: boolean; isLoadingMoreActivities: boolean; onOpenCalendar: () => void; onOpenApiLogs: () => void; onSelectActivity: (notification: AdminNotification) => void }) {
  const [analyticsOptOut, setAnalyticsOptOut] = useState(() => safeStorage.get("portfolio-analytics-opt-out") === "true");
  const [showAllActivities, setShowAllActivities] = useState(false);
  const analytics = useQuery({ queryKey: ["admin-analytics", 30], queryFn: () => fetchAdminAnalytics(30), refetchInterval: 60_000 });
  const system = useQuery({ queryKey: ["admin-system"], queryFn: fetchAdminSystem, refetchInterval: 30_000 });
  const apiMetrics = useQuery({ queryKey: ["admin-api-log-metrics"], queryFn: fetchAdminApiMetrics, refetchInterval: 60_000 });
  const tasksQuery = useQuery({ queryKey: ["admin-calendar-tasks"], queryFn: fetchCalendarTasks, refetchInterval: 60_000 });
  const a = analytics.data;
  const s = system.data;
  const cards = [
    { label: "Unique visitors · 30 days", value: a?.uniqueVisitors ?? "—", icon: <Users className="h-5 w-5" />, color: "text-sky-300" },
    { label: "Page views · 30 days", value: a?.pageViews ?? "—", icon: <Activity className="h-5 w-5" />, color: "text-indigo-300" },
    { label: "Beari avg response", value: a?.beari?.averageResponseMs == null ? "—" : `${a.beari.averageResponseMs} ms`, icon: <Bot className="h-5 w-5" />, color: "text-violet-300" },
    { label: "API process", value: s?.api ?? "Checking", icon: <Server className="h-5 w-5" />, color: s?.api === "online" ? "text-emerald-300" : "text-amber-300" },
  ];
  const daily = a?.daily ?? [];
  const now = Date.now();
  const upcomingTasks = (tasksQuery.data ?? []).filter((task) => !task.completed).sort((left, right) => left.due_at.localeCompare(right.due_at)).slice(0, 5);
  const sortedActivities = [...notifications].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
  const recentActivities = showAllActivities ? sortedActivities : sortedActivities.slice(0, 6);
  const max = Math.max(3, ...daily.map((d: { views: number }) => d.views));
  return <Panel title="Dashboard overview" desc="A live snapshot of portfolio traffic, Beari, and the API service.">
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">{cards.map((c) => <div key={c.label} className="card min-w-0 p-4 sm:p-5"><div className={`mb-3 sm:mb-4 ${c.color}`}>{c.icon}</div><p className="break-words font-display text-xl font-bold sm:text-2xl">{c.value}</p><p className="mt-1 text-xs text-muted">{c.label}</p></div>)}</div>
    <section className="card mt-4 min-w-0 overflow-hidden p-4 sm:mt-5 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent" />
          <div>
            <h2 className="font-semibold">API performance</h2>
            <p className="text-xs text-muted">Request health over the last 24 hours</p>
          </div>
        </div>
        <button type="button" onClick={onOpenApiLogs} className="btn-ghost btn-sm">
          View more <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {apiMetrics.isError ? (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
          API performance metrics are unavailable. Apply the API log migrations and configure SUPABASE_SECRET_KEY to enable this summary.
        </p>
      ) : (
        <>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
            {[
              {
                label: "Requests",
                value: apiMetrics.data?.requests ?? "—",
                color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
              },
              {
                label: "Errors",
                value: apiMetrics.data?.errors ?? "—",
                color: "border-danger/20 bg-danger/5 text-danger",
              },
              {
                label: "Warnings",
                value: apiMetrics.data?.warnings ?? "—",
                color: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
              },
              {
                label: "Average latency",
                value: apiMetrics.data ? `${apiMetrics.data.averageDurationMs} ms` : "—",
                color: "border-sky-500/20 bg-sky-500/5 text-sky-700 dark:text-sky-300",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className={`min-w-0 rounded-xl border p-3 sm:p-4 ${color}`}>
                <p className="break-words font-display text-lg font-bold sm:text-xl">{value}</p>
                <p className="mt-1 text-xs opacity-80">{label}</p>
              </div>
            ))}
          </div>
          {apiMetrics.data?.services.length ? (
            <div className="mt-4 grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {apiMetrics.data.services.slice(0, 6).map((service) => (
                <div key={service.service} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border/70 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted">{service.service}</span>
                  <span className="shrink-0 font-mono text-[10px] sm:text-xs">
                    {service.requests} req · {service.averageDurationMs} ms
                    {service.errors > 0 && <span className="ml-2 text-danger">{service.errors} err</span>}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted">
              {apiMetrics.isLoading ? "Loading API metrics…" : "API metrics will appear as requests are recorded."}
            </p>
          )}
        </>
      )}
    </section>
    <div className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[1.6fr_1fr]">
      <section className="card min-h-64 min-w-0 overflow-hidden p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><h2 className="font-semibold">Visitors</h2><p className="text-xs text-muted">Daily page views, past 30 days</p></div><BarChart3 className="h-5 w-5 shrink-0 text-sky-300" /></div>{analytics.isLoading ? <div className="mt-8 h-36 animate-pulse rounded-xl bg-surface-2" /> : daily.length ? <div className="mt-5 min-w-0 overflow-hidden" role="img" aria-label="Daily page views over the last 30 days"><svg className="block h-40 w-full max-w-full" viewBox="0 0 720 160" preserveAspectRatio="none"><g aria-hidden="true" stroke="hsl(var(--border))" strokeDasharray="3 5"><line x1="42" y1="12" x2="712" y2="12"/><line x1="42" y1="52" x2="712" y2="52"/><line x1="42" y1="92" x2="712" y2="92"/><line x1="42" y1="132" x2="712" y2="132"/></g><g fill="hsl(var(--faint))" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="end"><text x="36" y="15">{max}</text><text x="36" y="55">{Math.round(max * 2 / 3)}</text><text x="36" y="95">{Math.round(max / 3)}</text><text x="36" y="135">0</text></g>{daily.map((d: { date: string; views: number }, i: number) => { const width = 670 / daily.length; const height = d.views ? Math.max(2, d.views / max * 120) : 0; return <rect key={d.date} x={44 + i * width + width * 0.18} y={132 - height} width={Math.max(2, width * 0.64)} height={height} rx="2" fill="hsl(var(--accent))"><title>{`${d.date}: ${d.views} views`}</title></rect>; })}<g fill="hsl(var(--muted))" fontSize="10" fontFamily="ui-monospace, monospace"><text x="44" y="153">{daily[0]?.date.slice(5)}</text><text x="370" y="153" textAnchor="middle">{daily[Math.floor(daily.length / 2)]?.date.slice(5)}</text><text x="712" y="153" textAnchor="end">{daily[daily.length - 1]?.date.slice(5)}</text></g></svg><div className="mt-2 flex flex-wrap items-start justify-between gap-2 border-t border-border pt-2"><p className="text-[11px] text-muted">Your visits are {analyticsOptOut ? "excluded from" : "included in"} these metrics.</p><button type="button" className="text-left text-[11px] font-medium text-accent hover:underline" onClick={() => { const next = !analyticsOptOut; safeStorage.set("portfolio-analytics-opt-out", String(next)); setAnalyticsOptOut(next); }}>{analyticsOptOut ? "Include this browser" : "Exclude this browser"}</button></div></div> : <p className="mt-8 text-center text-sm text-muted">Traffic metrics will appear here as visitors browse the site.</p>}</section>
      <section className="card min-w-0 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><Cpu className="h-5 w-5 shrink-0 text-indigo-300" /><h2 className="font-semibold">System performance</h2></div><div className="space-y-3 text-sm">{[["Database", s?.database ?? "Checking"], ["Database latency", s?.databaseLatencyMs == null ? "—" : `${s.databaseLatencyMs} ms`], ["API uptime", s?.uptimeSeconds == null ? "—" : `${Math.floor(s.uptimeSeconds / 3600)}h ${Math.floor((s.uptimeSeconds % 3600) / 60)}m`], ["Memory", s?.memoryMb == null ? "—" : `${s.memoryMb} MB RSS`], ["Node", s?.nodeVersion ?? "—"]].map(([k,v]) => <div key={k} className="flex min-w-0 justify-between gap-2 border-b border-border/70 pb-2"><span className="text-muted">{k}</span><span className="max-w-[60%] break-all text-right font-mono text-[10px] sm:text-xs">{v}</span></div>)}</div><p className="mt-3 text-[11px] text-faint">API process metrics; hosting platform metrics remain in the Render dashboard.</p></section>
    </div>
    <div className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-2"><section className="card min-w-0 p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><Bot className="h-5 w-5 shrink-0 text-violet-300" /><h2 className="font-semibold">Beari performance</h2></div><div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3"><div className="min-w-0 rounded-xl bg-surface-2 p-3 sm:p-4"><p className="break-words font-display text-xl font-bold sm:text-2xl">{a?.beari?.requests ?? "—"}</p><p className="text-xs text-muted">responses · 30 days</p></div><div className="min-w-0 rounded-xl bg-surface-2 p-3 sm:p-4"><p className="break-words font-display text-xl font-bold sm:text-2xl">{a?.beari?.successRate == null ? "—" : `${a.beari.successRate}%`}</p><p className="text-xs text-muted">successful responses</p></div></div></section><section className="card min-w-0 p-4 sm:p-5"><h2 className="mb-3 font-semibold">Popular pages</h2>{a?.popularPages?.length ? a.popularPages.slice(0,5).map((p: { path: string; views: number }) => <div key={p.path} className="flex min-w-0 justify-between gap-2 border-b border-border/70 py-2 text-sm"><span className="min-w-0 truncate text-muted">{p.path}</span><span className="shrink-0 font-mono text-xs">{p.views}</span></div>) : <p className="text-sm text-muted">Your most visited pages will show here.</p>}</section></div>
    <div className="mt-4 grid min-w-0 gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-2">
      <section className="card min-w-0 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><CalendarDays className="h-5 w-5 shrink-0 text-accent" /><div className="min-w-0"><h2 className="font-semibold">Tasks</h2><p className="text-xs text-muted">Upcoming and overdue</p></div></div><button type="button" onClick={onOpenCalendar} className="btn-ghost btn-sm">Calendar <ArrowRight className="h-3.5 w-3.5" /></button></div>
        {tasksQuery.isLoading ? <p className="py-4 text-sm text-muted">Loading tasks…</p> : tasksQuery.isError ? <p className="py-4 text-sm text-danger">Couldn’t load tasks.</p> : upcomingTasks.length ? <div className="divide-y divide-border">{upcomingTasks.map((task) => { const due = new Date(task.due_at); const overdue = due.getTime() < now; return <div key={task.id} className="flex items-start gap-3 py-3"><Clock3 className={`mt-0.5 h-4 w-4 shrink-0 ${overdue ? "text-danger" : "text-muted"}`} /><div className="min-w-0"><p className="truncate text-sm font-medium">{task.title}</p><p className={`mt-1 text-xs ${overdue ? "text-danger" : "text-muted"}`}>{overdue ? "Overdue · " : ""}{due.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p></div></div>; })}</div> : <div className="py-5 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-success" /><p className="mt-2 text-sm text-muted">You’re all caught up. No open tasks.</p></div>}
        <button type="button" onClick={onOpenCalendar} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-xs font-medium text-accent hover:bg-surface-2"><Plus className="h-3.5 w-3.5" /> Add a task</button>
      </section>
      <section className="card min-w-0 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2"><Activity className="h-5 w-5 shrink-0 text-sky-300" /><div className="min-w-0"><h2 className="font-semibold">Recent activity</h2><p className="text-xs text-muted">Messages, visitors, Beari, content, and calendar changes</p></div></div>
          {(sortedActivities.length > 6 || hasMoreActivities) && (
            <button
              type="button"
              disabled={isLoadingMoreActivities}
              onClick={() => {
                if (hasMoreActivities) {
                  setShowAllActivities(true);
                  onLoadMoreActivities();
                } else {
                  setShowAllActivities((showing) => !showing);
                }
              }}
              className="btn-ghost btn-sm shrink-0"
            >
              {isLoadingMoreActivities ? "Loading more…" : hasMoreActivities ? "View more" : showAllActivities ? "Show less" : "View more"}
              <ArrowRight className={`h-3.5 w-3.5 ${showAllActivities && !hasMoreActivities ? "-rotate-90" : ""}`} />
            </button>
          )}
        </div>
        {recentActivities.length ? <div className="divide-y divide-border">{recentActivities.map((item) => <button key={item.id} type="button" onClick={() => onSelectActivity(item)} className="flex min-w-0 w-full items-start gap-2 py-3 text-left hover:bg-surface-2/60 sm:gap-3"><span className="mt-0.5 shrink-0 text-accent">{item.category === "message" ? <MessageSquare className="h-4 w-4" /> : item.category === "beari" ? <Bot className="h-4 w-4" /> : item.category === "feedback" ? <Sparkles className="h-4 w-4" /> : item.category === "visitor" ? <Users className="h-4 w-4" /> : item.category === "calendar" ? <CalendarDays className="h-4 w-4" /> : <Activity className="h-4 w-4" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.title}</span><span className="mt-1 block truncate text-xs text-muted">{item.body}{item.occurrence_count > 1 ? ` · ${item.occurrence_count} events` : ""}</span></span><time className="max-w-14 shrink-0 text-right font-mono text-[9px] text-faint sm:max-w-none sm:text-[10px]">{new Date(item.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></button>)}</div> : <p className="py-5 text-center text-sm text-muted">Messages, visitors, Beari, content, and calendar activity will show here.</p>}
      </section>
    </div>
  </Panel>;
}

function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function CalendarPanel({ adminEmail }: { adminEmail: string }) {
  const { showModal } = useModal();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(() => dateKey(now));
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [dueAt, setDueAt] = useState(() => `${dateKey(now)}T09:00`);
  const [reminderOffset, setReminderOffset] = useState("15");
  const [taskError, setTaskError] = useState("");
  const [suggestionNotice, setSuggestionNotice] = useState("");
  const [suggestionError, setSuggestionError] = useState("");
  const tasksQuery = useQuery({ queryKey: ["admin-calendar-tasks"], queryFn: fetchCalendarTasks, refetchInterval: 60_000 });
  const emailStatus = useQuery({ queryKey: ["beari-email-status"], queryFn: getBeariEmailStatus });
  const tasks = tasksQuery.data ?? [];
  const create = useMutation({ mutationFn: createCalendarTask, onSuccess: () => { setTitle(""); setDetails(""); setLocation(""); setTaskError(""); void qc.invalidateQueries({ queryKey: ["admin-calendar-tasks"] }); } });
  const suggestTask = useMutation({
    mutationFn: suggestCalendarTask,
    onSuccess: (suggestion) => {
      setTitle(suggestion.title);
      setDetails(suggestion.details);
      if (suggestion.location) setLocation(suggestion.location);
      setSuggestionNotice("Beari drafted this task. Review or edit it before adding.");
      setSuggestionError("");
    },
    onError: (error) => {
      const apiError = error as { message?: string; response?: { data?: { message?: string } } };
      setSuggestionError(apiError.response?.data?.message || apiError.message || "Beari couldn’t suggest this task. Try again.");
      setSuggestionNotice("");
    },
  });
  const update = useMutation({ mutationFn: ({ id, completed }: { id: string; completed: boolean }) => updateCalendarTask(id, completed), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-calendar-tasks"] }) });
  const remove = useMutation({ mutationFn: deleteCalendarTask, onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-calendar-tasks"] }); showModal({ type: "success", title: "Calendar task deleted", description: "The task was removed from your calendar." }); }, onError: (error) => showModal({ type: "error", title: "Could not delete calendar task", description: (error as Error).message || "Please try again." }) });
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(monthStart.getDay()).fill(null), ...Array.from({ length: dayCount }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  while (cells.length % 7) cells.push(null);
  const tasksForDay = tasks.filter((task) => dateKey(new Date(task.due_at)) === selectedDay).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const taskDays = new Set(tasks.map((task) => dateKey(new Date(task.due_at))));
  const submitTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setTaskError("");
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) { setTaskError("Choose a valid due date and time."); return; }
    const offset = reminderOffset === "none" ? null : new Date(due.getTime() - Number(reminderOffset) * 60_000).toISOString();
    create.mutate({ title: title.trim(), details: details.trim(), location: location.trim(), due_at: due.toISOString(), time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", reminder_at: offset });
  };
  const dayLabel = (task: CalendarTask) => new Date(task.due_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return <Panel title="Calendar & reminders" desc="Plan tasks and schedule email reminders.">
    {!emailStatus.data?.configured && <div role="status" className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Email reminders need <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> configured in the backend environment.</div>}
    {emailStatus.isError && <div role="alert" className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">Couldn’t check email reminder configuration.</div>}
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-xs text-muted">Select a date to view or schedule tasks</p><h2 className="mt-1 font-display text-xl font-bold">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2></div><div className="flex gap-2"><button type="button" aria-label="Previous month" className="btn-ghost btn-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></button><button type="button" aria-label="Next month" className="btn-ghost btn-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></button></div></div>
        <div className="grid grid-cols-7 gap-1 text-center">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day} className="py-2 text-[11px] font-medium text-faint">{day}</span>)}{cells.map((date, index) => { const key = date ? dateKey(date) : `blank-${index}`; const active = key === selectedDay; return <button key={key} type="button" disabled={!date} onClick={() => { if (date) { setSelectedDay(key); setDueAt(`${key}T09:00`); } }} className={`relative grid aspect-square place-items-center rounded-xl text-sm transition-colors disabled:pointer-events-none ${active ? "bg-accent text-accent-ink" : date ? "hover:bg-surface-2" : ""} ${date && key === dateKey(now) && !active ? "font-bold text-accent" : ""}`}>{date?.getDate()}{date && taskDays.has(key) && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${active ? "bg-accent-ink" : "bg-accent"}`} />}</button>; })}</div>
      </section>
      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Add a task</h2><button type="button" className="btn-ghost btn-sm" disabled={suggestTask.isPending || !title.trim() && !details.trim() && !location.trim()} onClick={() => { setSuggestionError(""); setSuggestionNotice(""); suggestTask.mutate({ title: title.trim(), details: details.trim(), location: location.trim(), dueAt }); }}><Sparkles className="h-4 w-4" />{suggestTask.isPending ? "Beari is thinking…" : "Suggest with Beari"}</button></div>
        <p className="mb-4 text-xs text-muted">Enter a rough task idea, then Beari can draft a title and useful details for you to review.</p>
        {taskError && <p role="alert" className="mb-3 text-sm text-danger">{taskError}</p>}
        {create.isError && <p role="alert" className="mb-3 text-sm text-danger">{(create.error as Error).message}</p>}
        {suggestionError && <p role="alert" className="mb-3 text-sm text-danger">{suggestionError}</p>}
        {suggestionNotice && <p role="status" className="mb-3 text-sm text-success">{suggestionNotice}</p>}
        <form onSubmit={submitTask} className="space-y-3">
          <Field label="Task title"><input className="input" maxLength={160} required disabled={suggestTask.isPending} value={title} onChange={(event) => { setTitle(event.target.value); setSuggestionNotice(""); }} placeholder="What needs to get done?" /></Field>
          <Field label="Details"><textarea className="input min-h-20" maxLength={4000} disabled={suggestTask.isPending} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Notes or context for the reminder" /></Field>
          <Field label="Location (optional)"><input className="input" maxLength={300} disabled={suggestTask.isPending} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Where is this task happening?" /></Field>
          <div className="grid min-w-0 gap-3"><Field label="Due date and time"><input className="input w-full min-w-0" type="datetime-local" required value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></Field><Field label="Email reminder"><select className="input w-full min-w-0" value={reminderOffset} onChange={(event) => setReminderOffset(event.target.value)}><option value="none">No email reminder</option><option value="0">At the due time</option><option value="15">15 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option></select></Field></div>
          <p className="text-[11px] text-faint">Reminder goes to your admin email: {adminEmail || "not available"}</p>
          <button className="btn-primary btn-sm" disabled={create.isPending || suggestTask.isPending || (!emailStatus.data?.configured && reminderOffset !== "none")}><Plus className="h-4 w-4" />{create.isPending ? "Saving…" : "Add task"}</button>
        </form>
      </section>
    </div>
    <section className="card mt-5 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Tasks for {new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "full" })}</h2><p className="mt-1 text-xs text-muted">{tasksForDay.length} task{tasksForDay.length === 1 ? "" : "s"}</p></div><CalendarDays className="h-5 w-5 text-accent" /></div>
      {tasksQuery.isLoading ? <p className="text-sm text-muted">Loading tasks…</p> : tasksQuery.isError ? <p className="text-sm text-danger">Couldn’t load calendar tasks. {(tasksQuery.error as Error).message}</p> : tasksForDay.length ? <div className="divide-y divide-border">{tasksForDay.map((task) => <div key={task.id} className="flex items-start gap-3 py-3"><input aria-label={`Mark ${task.title} complete`} className="mt-1 h-4 w-4 accent-[var(--accent)]" type="checkbox" checked={task.completed} onChange={(event) => update.mutate({ id: task.id, completed: event.target.checked })} /><div className="min-w-0 flex-1"><p className={`font-medium ${task.completed ? "text-muted line-through" : ""}`}>{task.title}</p><p className="mt-1 text-xs text-muted">{dayLabel(task)}{task.reminder_at ? ` · email reminder ${task.reminder_sent_at ? "sent" : "scheduled"}` : " · no reminder"}</p>{task.location && <p className="mt-2 text-xs text-muted">Location: {task.location}</p>}{task.details && <p className="mt-2 whitespace-pre-line text-sm text-muted">{task.details}</p>}</div><button type="button" disabled={remove.isPending} aria-label={`Delete ${task.title}`} className="btn-ghost btn-sm text-muted hover:text-danger disabled:cursor-wait disabled:opacity-60" onClick={() => remove.mutate(task.id)}>{remove.isPending ? <Activity className="h-4 w-4 animate-pulse" /> : <Trash2 className="h-4 w-4" />}</button></div>)}</div> : <p className="py-5 text-center text-sm text-muted">No tasks on this day yet.</p>}
    </section>
  </Panel>;
}

export function AdminsPanel({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { showModal } = useModal();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<AdminAccount["role"]>("admin");
  const [notice, setNotice] = useState("");
  const admins = useQuery({ queryKey: ["admin-accounts"], queryFn: fetchAdminAccounts });
  const invite = useMutation({
    mutationFn: inviteAdminAccount,
    onSuccess: (account) => {
      setNotice(`Admin account created. Setup email sent to ${account.email} with a temporary password and one-time sign-in link.`);
      setName("");
      setEmail("");
      setTemporaryPassword("");
      void qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, ...input }: { id: string; name: string; email: string; role: AdminAccount["role"] }) => updateAdminAccount(id, input),
    onSuccess: (account) => {
      setEditingId(null);
      setNotice(`Updated ${account.email}.`);
      void qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
  const remove = useMutation({
    mutationFn: deleteAdminAccount,
    onSuccess: () => {
      setNotice("Admin account deleted.");
      showModal({ type: "success", title: "Admin deleted", description: "The administrator account was removed." });
      void qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
  });
  const edit = (account: AdminAccount) => {
    setEditingId(account.user_id); setEditName(account.name); setEditEmail(account.email); setEditRole(account.role); setNotice("");
  };
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    invite.mutate({ name: name.trim(), email: email.trim(), temporaryPassword });
  };
  const saveEdit = (event: React.FormEvent<HTMLFormElement>, account: AdminAccount) => {
    event.preventDefault(); setNotice("");
    update.mutate({ id: account.user_id, name: editName.trim(), email: editEmail.trim(), role: editRole });
  };
  const removeAccount = (account: AdminAccount) => {
    if (window.confirm(`Delete the admin account for ${account.email}? This action cannot be undone.`)) {
      setNotice(""); remove.mutate(account.user_id);
    }
  };
  const mutationError = invite.error || update.error || remove.error;
  return <Panel title="Administrators" desc={isSuperAdmin ? "Create and manage admin accounts." : "View admin accounts. Only a super admin can create or manage accounts."}>
    {notice && <div role="status" className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{notice}</div>}
    {isSuperAdmin && mutationError && <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{(mutationError as Error).message}</div>}
    {isSuperAdmin && <form onSubmit={submit} className="card mb-5 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1fr_auto] xl:items-end">
      <Field label="Admin name"><input className="input" autoComplete="name" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" /></Field>
      <Field label="Email address"><input className="input" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></Field>
      <Field label="Temporary password"><input className="input" type="password" autoComplete="new-password" minLength={8} maxLength={256} required value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} placeholder="At least 8 characters" /></Field>
      <button className="btn-primary btn-sm h-10" type="submit" disabled={invite.isPending}><UserPlus className="h-4 w-4" />{invite.isPending ? "Creating account…" : "Create admin"}</button>
    </form>}
    <div className="card overflow-hidden">
      <div className={`grid ${isSuperAdmin ? "grid-cols-[1fr_auto]" : "grid-cols-1"} gap-3 border-b border-border bg-surface-2 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted`}><span>Admin account</span>{isSuperAdmin && <span>Super admin actions</span>}</div>
      {admins.isLoading ? <div className="h-28 animate-pulse bg-surface-2/50" /> : admins.isError ? <p className="p-5 text-sm text-danger">Could not load administrators: {(admins.error as Error).message}</p> : admins.data?.length ? admins.data.map((account: AdminAccount) => editingId === account.user_id && isSuperAdmin ? <form key={account.user_id} onSubmit={(event) => saveEdit(event, account)} className="grid gap-3 border-b border-border/70 p-4 last:border-0 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_180px_auto]"><Field label="Name"><input className="input" required maxLength={120} value={editName} onChange={(event) => setEditName(event.target.value)} /></Field><Field label="Email"><input className="input" type="email" required maxLength={254} value={editEmail} onChange={(event) => setEditEmail(event.target.value)} /></Field><Field label="Role"><select className="input" value={editRole} onChange={(event) => setEditRole(event.target.value as AdminAccount["role"])}><option value="admin">Admin</option><option value="superAdmin">Super admin</option></select></Field><div className="flex items-end gap-2"><button type="submit" className="btn-primary btn-sm" disabled={update.isPending}>{update.isPending ? <Check className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}Save</button><button type="button" className="btn-ghost btn-sm" onClick={() => setEditingId(null)}><X className="h-4 w-4" />Cancel</button></div></form> : <div key={account.user_id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3 last:border-0"><div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2"><span className="flex min-w-0 items-center gap-2 text-sm font-medium"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><ShieldCheck className="h-4 w-4" /></span><span className="truncate">{account.name}</span></span><span className="truncate text-sm text-muted">{account.email}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${account.role === "superAdmin" ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>{account.role === "superAdmin" ? "Super Admin" : "Admin"}</span></div>{isSuperAdmin && <div className="flex shrink-0 items-center gap-1"><button type="button" className="btn-ghost btn-sm" onClick={() => edit(account)} aria-label={`Edit ${account.email}`}><Pencil className="h-4 w-4" /><span className="hidden sm:inline">Edit</span></button><button type="button" className="btn-ghost btn-sm text-danger hover:text-danger" onClick={() => removeAccount(account)} disabled={remove.isPending} aria-label={`Delete ${account.email}`}><span className="sr-only">Delete </span>{remove.isPending ? <Activity className="h-4 w-4 animate-pulse" /> : <Trash2 className="h-4 w-4" />}<span className="hidden sm:inline">{remove.isPending ? "Deleting…" : "Delete"}</span></button></div>}</div>) : <p className="p-8 text-center text-sm text-muted">No administrators found.</p>}
    </div>
    {isSuperAdmin && <p className="mt-3 text-xs text-muted">The setup email includes the temporary password and a one-time link that expires after 15 minutes. The new admin should change the temporary password after signing in. New accounts receive the Admin role. You can edit names, emails, and roles or delete admin accounts here.</p>}
  </Panel>;
}
