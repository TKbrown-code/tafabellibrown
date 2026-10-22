import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CircleAlert, CircleCheck, CircleX, Clock3, Database, Gauge, HardDrive, RotateCw, Server, Trash2, Wifi } from "lucide-react";
import { fetchAdminApiMetrics, type AdminApiLog } from "@/lib/api";

const typeStyles = {
  info: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warn: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  error: "border-danger/20 bg-danger/10 text-danger",
};

const messageStyles = {
  info: "text-emerald-800 dark:text-emerald-200",
  warn: "text-amber-800 dark:text-amber-200",
  error: "text-danger",
};

const rowStyles = {
  info: "border-l-2 border-l-emerald-500 bg-emerald-500/[0.025]",
  warn: "border-l-2 border-l-amber-500 bg-amber-500/[0.035]",
  error: "border-l-2 border-l-danger bg-danger/[0.035]",
};

const chartMetrics = {
  requests: { label: "Requests", color: "#f97316", format: (value: number) => `${Math.round(value)} requests` },
  errors: { label: "Errors", color: "#ef4444", format: (value: number) => `${Math.round(value)} errors` },
  warnings: { label: "Warnings", color: "#eab308", format: (value: number) => `${Math.round(value)} warnings` },
  latency: { label: "Avg. latency", color: "#60a5fa", format: (value: number) => `${Math.round(value)} ms` },
  pageViews: { label: "Page views", color: "#a78bfa", format: (value: number) => `${Math.round(value)} views` },
} as const;

type ChartMetric = keyof typeof chartMetrics;

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
}

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** unit).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${units[unit]}`;
}

function HealthIndicator({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  const Icon = ok ? CircleCheck : CircleX;
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3 py-3">
      <Icon className={`h-4 w-4 shrink-0 ${ok ? "text-emerald-500" : "text-danger"}`} />
      <div className="min-w-0">
        <p className="text-xs font-medium">{label}</p>
        <p className="truncate text-[11px] text-muted">{detail}</p>
      </div>
    </div>
  );
}

export function ApiLogsPanel({
  logs,
  isLive,
  isLoading,
  hasError,
  onRefresh,
  onClear,
  clearPending,
}: {
  logs: AdminApiLog[];
  isLive: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRefresh: () => void;
  onClear: () => void;
  clearPending: boolean;
}) {
  const [serviceFilter, setServiceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("requests");
  const metricsQuery = useQuery({ queryKey: ["admin-api-log-metrics"], queryFn: fetchAdminApiMetrics, refetchInterval: 30_000 });
  const metrics = metricsQuery.data;
  const timeline = metrics?.timeline ?? [];
  const services = useMemo(() => [...new Set(logs.map((log) => log.service))].sort(), [logs]);
  const visibleLogs = logs.filter((log) =>
    (serviceFilter === "all" || log.service === serviceFilter) &&
    (typeFilter === "all" || log.type === typeFilter),
  );
  const metricValue = (point: (typeof timeline)[number]) => point[chartMetric === "latency" ? "averageDurationMs" : chartMetric];
  const chart = useMemo(() => {
    const width = 720;
    const height = 280;
    const left = 52;
    const right = 704;
    const top = 18;
    const bottom = 220;
    const max = Math.max(chartMetric === "latency" ? 100 : 4, ...timeline.map((point) => point[chartMetric === "latency" ? "averageDurationMs" : chartMetric]));
    const points = timeline.map((point, index) => ({
      ...point,
      x: left + (timeline.length > 1 ? (index / (timeline.length - 1)) * (right - left) : (right - left) / 2),
      y: bottom - ((point[chartMetric === "latency" ? "averageDurationMs" : chartMetric] / max) * (bottom - top)),
    }));
    const line = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      return `${path} Q ${previous.x} ${previous.y} ${(previous.x + point.x) / 2} ${(previous.y + point.y) / 2}`;
    }, "");
    const last = points[points.length - 1];
    const smoothLine = last ? `${line} T ${last.x} ${last.y}` : "";
    const area = last ? `${smoothLine} L ${last.x} ${bottom} L ${points[0].x} ${bottom} Z` : "";
    return { width, height, left, right, top, bottom, max, points, line: smoothLine, area };
  }, [timeline, chartMetric]);
  const selectedPoint = activeHour === null ? chart.points[chart.points.length - 1] : chart.points[activeHour];
  const health = metrics?.health;
  const storage = metrics?.storage;
  const cloudflareStorage = metrics?.cloudflareStorage;

  return (
    <section className="space-y-6" aria-labelledby="api-logs-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">API observability</p>
          <h1 id="api-logs-title" className="mt-1 font-display text-2xl font-bold">API logs</h1>
          <p className="mt-1 text-sm text-muted">Requests, incidents, latency, storage, dependencies, and scheduled jobs · last 24 hours</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="flex items-center gap-2 text-xs text-muted"><span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-500"}`} />{isLive ? "Live" : "Reconnecting"}</span>
          <button type="button" onClick={onRefresh} disabled={isLoading} className="btn-ghost btn-sm"><RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />Refresh</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "API requests", value: metrics?.requests ?? "—", detail: "All logged requests", Icon: Activity },
          { label: "Client errors", value: metrics?.clientErrors ?? "—", detail: "HTTP 4xx", Icon: CircleAlert, danger: Boolean(metrics?.clientErrors) },
          { label: "Server errors", value: metrics?.serverErrors ?? "—", detail: "HTTP 5xx", Icon: CircleX, danger: Boolean(metrics?.serverErrors) },
          { label: "Warnings", value: metrics?.warnings ?? "—", detail: "Application warnings", Icon: AlertTriangle, warning: Boolean(metrics?.warnings) },
          { label: "Average latency", value: metrics ? `${Math.round(metrics.averageDurationMs)} ms` : "—", detail: "Measured API requests", Icon: Clock3 },
          { label: "95th percentile", value: metrics ? `${Math.round(metrics.p95DurationMs)} ms` : "—", detail: "Most requests are faster", Icon: Gauge },
        ].map(({ label, value, detail, Icon, danger, warning }) => (
          <article key={label} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted">{label}</p><Icon className={`h-4 w-4 ${danger ? "text-danger" : warning ? "text-amber-500" : "text-accent"}`} /></div>
            <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-[11px] text-faint">{detail}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="system-health-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="system-health-title" className="font-semibold">System health</h2><p className="mt-1 text-xs text-muted">Live checks and process resources</p></div>
          {health && <span className="text-xs text-muted">Uptime {Math.floor(health.api.uptimeSeconds / 3600)}h {Math.floor((health.api.uptimeSeconds % 3600) / 60)}m · {health.api.nodeVersion}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HealthIndicator label="API process" ok={health?.api.ok ?? false} detail={health ? `Running · ${health.api.nodeVersion}` : "Loading status…"} />
          <HealthIndicator label="Supabase database" ok={health?.database.ok ?? false} detail={health?.database.ok ? `Reachable · ${health.database.durationMs} ms` : health ? "Connection check failed" : "Loading status…"} />
          <HealthIndicator label="Redis cache" ok={health?.redis.ok ?? false} detail={health?.redis.ok ? `Reachable · ${health.redis.durationMs} ms` : health ? "Connection check failed" : "Loading status…"} />
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/50 px-3 py-3"><Server className="h-4 w-4 shrink-0 text-accent" /><div className="min-w-0"><p className="text-xs font-medium">Process memory</p><p className="truncate text-[11px] text-muted">{health ? `${formatBytes(health.memory.heapUsedBytes)} heap · ${formatBytes(health.memory.rssBytes)} RSS` : "Loading usage…"}</p></div></div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="flex items-center gap-2 text-xs font-medium"><Database className="h-4 w-4 text-accent" />Database latency</p><p className="mt-1 text-[11px] text-muted">{health ? `${health.database.durationMs} ms · live check` : "Unavailable"}</p></div>
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="flex items-center gap-2 text-xs font-medium"><Wifi className="h-4 w-4 text-accent" />Redis latency</p><p className="mt-1 text-[11px] text-muted">{health?.redis.durationMs === null || !health ? "Unavailable" : `${health.redis.durationMs} ms · live check`}</p></div>
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="flex items-center gap-2 text-xs font-medium"><HardDrive className="h-4 w-4 text-accent" />Supabase storage</p><p className="mt-1 text-[11px] text-muted">{storage ? `${storage.objects.toLocaleString()} objects · ${formatBytes(storage.bytes)}` : metrics ? "Usage metrics need the latest database migration" : "Loading usage…"}</p></div>
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="flex items-center gap-2 text-xs font-medium"><HardDrive className="h-4 w-4 text-accent" />Cloudflare R2 documents</p><p className="mt-1 text-[11px] text-muted">{cloudflareStorage?.configured && cloudflareStorage.objects !== null ? `${cloudflareStorage.objects.toLocaleString()} objects · ${formatBytes(cloudflareStorage.bytes ?? 0)} · ${cloudflareStorage.bucket}` : cloudflareStorage?.configured ? "Bucket is configured; usage check failed" : cloudflareStorage ? "R2 is not configured on this API" : "Usage check unavailable"}</p></div>
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="text-xs font-medium">Runtime memory</p><p className="mt-1 text-[11px] text-muted">{health ? `${formatBytes(health.memory.heapUsedBytes)} used / ${formatBytes(health.memory.heapTotalBytes)} heap` : "Unavailable"}</p></div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="text-xs font-medium">Visitor access · 24 hours</p><p className="mt-1 text-sm font-semibold">{metrics?.access?.pageViews.toLocaleString() ?? "—"} page views</p><p className="text-[11px] text-muted">{metrics?.access?.uniqueVisitors.toLocaleString() ?? "—"} unique visitors · aggregate counts only</p></div>
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="text-xs font-medium">Beari responses · 24 hours</p><p className="mt-1 text-sm font-semibold">{metrics?.beari?.responses.toLocaleString() ?? "—"} responses</p><p className="text-[11px] text-muted">{metrics?.beari?.failures ?? "—"} failures · avg {Math.round(metrics?.beari?.averageDurationMs ?? 0)} ms</p></div>
          <div className="rounded-xl border border-border bg-surface-2/50 px-3 py-3"><p className="text-xs font-medium">Top visitor paths</p><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">{metrics?.access?.topPaths.slice(0, 4).map((path) => <span key={path.path}>{path.path || "/"} · {path.views}</span>) ?? "—"}</div></div>
        </div>
        {storage?.buckets?.length ? <div className="mt-4 flex flex-wrap gap-2">{storage.buckets.map((bucket) => <span key={bucket.bucket} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] text-muted">{bucket.bucket} · {bucket.objects.toLocaleString()} files · {formatBytes(bucket.bytes)}</span>)}</div> : null}
      </section>

      <div className="grid items-start gap-y-5 gap-x-5 xl:gap-x-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:grid-rows-[auto_auto]">
        <div className="min-w-0 space-y-5">
        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="api-log-graph-title">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div><h2 id="api-log-graph-title" className="font-semibold">System activity</h2><p className="mt-1 text-xs text-muted">Hourly request and health trends · last 24 hours</p></div>
            <div className="text-right"><p className="font-mono text-xl font-semibold">{metrics?.requests ?? "—"}</p><p className="text-[11px] text-muted">total requests</p></div>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Select graph metric">
            {(Object.keys(chartMetrics) as ChartMetric[]).map((key) => <button key={key} type="button" onClick={() => setChartMetric(key)} className={`rounded-full border px-2.5 py-1 text-[11px] ${chartMetric === key ? "border-accent/40 bg-accent/10 text-ink" : "border-border text-muted"}`}><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: chartMetrics[key].color }} />{chartMetrics[key].label}</button>)}
          </div>
          <div className="mb-1 flex min-h-8 items-center justify-between gap-2 text-[11px] text-muted">
            <span>{chartMetrics[chartMetric].label} by hour</span>
            {selectedPoint && <div className="text-right"><span>{new Date(selectedPoint.hour).toLocaleString(undefined, { weekday: "short", hour: "numeric" })}</span><span className="ml-2 font-mono text-ink">{chartMetrics[chartMetric].format(metricValue(selectedPoint))}</span></div>}
          </div>
          {metricsQuery.isError ? <p role="alert" className="py-16 text-center text-sm text-danger">Could not load system activity metrics.</p> : (
            <svg className="w-full overflow-visible" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={`Hourly ${chartMetrics[chartMetric].label.toLowerCase()} during the last 24 hours`}>
              <defs><linearGradient id="api-log-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={chartMetrics[chartMetric].color} stopOpacity="0.32" /><stop offset="100%" stopColor={chartMetrics[chartMetric].color} stopOpacity="0.015" /></linearGradient></defs>
              {[0, 0.5, 1].map((fraction) => { const y = chart.bottom - fraction * (chart.bottom - chart.top); return <g key={fraction}><line x1={chart.left} x2={chart.right} y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray={fraction === 0 ? undefined : "3 5"} /><text x={chart.left - 10} y={y + 4} textAnchor="end" fill="currentColor" className="text-faint" fontSize="10">{Math.round(chart.max * fraction)}</text></g>; })}
              {chart.area && <path d={chart.area} fill="url(#api-log-area)" />}{chart.line && <path d={chart.line} fill="none" stroke={chartMetrics[chartMetric].color} strokeWidth="3" strokeLinecap="round" />}
              {chart.points.map((point, index) => <circle key={point.hour} cx={point.x} cy={point.y} r={activeHour === index || (activeHour === null && index === chart.points.length - 1) ? 5 : 2.5} fill={chartMetrics[chartMetric].color} stroke="hsl(var(--surface))" strokeWidth="2" className="cursor-crosshair transition-all" tabIndex={0} aria-label={`${new Date(point.hour).toLocaleString()}: ${chartMetrics[chartMetric].format(metricValue(point))}; ${point.errors} errors; ${point.warnings} warnings`} onMouseEnter={() => setActiveHour(index)} onMouseLeave={() => setActiveHour(null)} onFocus={() => setActiveHour(index)} onBlur={() => setActiveHour(null)}><title>{`${new Date(point.hour).toLocaleString()}: ${chartMetrics[chartMetric].format(metricValue(point))}; ${point.errors} errors; ${point.warnings} warnings`}</title></circle>)}
              {timeline.length > 0 && [0, 6, 12, 18, 23].map((index) => { const point = chart.points[Math.min(index, chart.points.length - 1)]; if (!point) return null; return <text key={index} x={point.x} y={chart.height - 12} textAnchor={index === 0 ? "start" : index === 23 ? "end" : "middle"} fill="currentColor" className="text-faint" fontSize="10">{new Date(point.hour).toLocaleTimeString(undefined, { hour: "numeric" })}</text>; })}
              {timeline.length === 0 && !metricsQuery.isLoading && <text x="360" y="120" textAnchor="middle" fill="currentColor" className="text-muted" fontSize="12">No request data for the last 24 hours</text>}
            </svg>
          )}
          <div className="mt-2 flex flex-wrap justify-between gap-2 border-t border-border pt-3 text-[11px] text-muted"><span><span className="font-medium text-danger">{metrics?.errors ?? 0}</span> errors</span><span><span className="font-medium text-amber-600">{metrics?.warnings ?? 0}</span> warnings</span><span>Avg. {Math.round(metrics?.averageDurationMs ?? 0)} ms</span><span>P95 {Math.round(metrics?.p95DurationMs ?? 0)} ms</span></div>
        </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface" aria-labelledby="latest-logs-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4">
          <div><h2 id="latest-logs-title" className="font-semibold">Latest system activity</h2><p className="mt-1 text-xs text-muted">API requests, warnings, errors, and Blog schedule runs · newest first</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onClear} disabled={clearPending || logs.length === 0} className="btn-ghost btn-sm text-danger disabled:cursor-wait disabled:opacity-60" title="Clear API request logs">{clearPending ? <Activity className="h-3.5 w-3.5 animate-pulse" /> : <Trash2 className="h-3.5 w-3.5" />}{clearPending ? "Clearing…" : "Clear logs"}</button>
            <label className="sr-only" htmlFor="api-log-service-filter">Filter by service</label><select id="api-log-service-filter" className="input h-9 w-auto min-w-32 text-xs" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}><option value="all">All services</option>{services.map((service) => <option key={service} value={service}>{service}</option>)}</select>
            <label className="sr-only" htmlFor="api-log-type-filter">Filter by log type</label><select id="api-log-type-filter" className="input h-9 w-auto min-w-28 text-xs" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All types</option><option value="info">Info</option><option value="warn">Warning</option><option value="error">Error</option></select>
          </div>
        </div>
        {isLoading && logs.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted">Loading system activity…</p> : hasError && logs.length === 0 ? <p className="px-5 py-10 text-center text-sm text-danger">System activity couldn’t load. Check your connection and admin access.</p> : visibleLogs.length === 0 ? <div className="px-5 py-12 text-center">{hasError ? <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" /> : <Activity className="mx-auto h-5 w-5 text-faint" />}<p className="mt-3 text-sm text-muted">{hasError ? "Could not refresh activity. Showing no matching entries." : "No matching system activity yet."}</p></div> : (
          <div className="max-h-[70vh] divide-y divide-border overflow-y-auto">{visibleLogs.map((log) => <article key={log.id} className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${rowStyles[log.type]}`}><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${typeStyles[log.type]}`}>{log.type}</span><span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">{log.service}</span>{log.method && <span className="font-mono text-[11px] text-muted">{log.method} {log.path}</span>}</div><p className={`break-words text-sm ${messageStyles[log.type]}`}>{log.message}</p><p className="font-mono text-[10px] text-faint">{formatTimestamp(log.created_at)}</p></div><div className="flex shrink-0 items-center gap-3 sm:justify-end">{log.status_code !== null && <span className={`rounded-lg px-2 py-1 font-mono text-xs ${log.status_code >= 500 ? "bg-danger/10 text-danger" : log.status_code >= 400 ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-surface-2 text-muted"}`}>{log.status_code}</span>}{log.duration_ms !== null && <span className="min-w-16 text-right font-mono text-xs text-muted">{log.duration_ms} ms</span>}</div></article>)}</div>
        )}
      </section>
        </div>
        <section className="rounded-2xl border border-border bg-surface p-5" aria-labelledby="service-breakdown-title">
          <div className="mb-4"><h2 id="service-breakdown-title" className="font-semibold">Service and endpoint breakdown</h2><p className="mt-1 text-xs text-muted">Traffic, failures, and latency by API area</p></div>
          {metrics?.services.length ? <div className="space-y-2">{metrics.services.map((service) => <div key={service.service} className="rounded-xl border border-border px-3 py-2.5"><div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate text-sm font-medium">{service.service}</span><span className="shrink-0 font-mono text-xs">{service.requests} req · {service.events} events</span></div><div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted"><span className="text-danger">{service.errors} errors</span><span className="text-amber-600">{service.warnings} warnings</span><span>avg {Math.round(service.averageDurationMs)} ms</span><span>p95 {Math.round(service.p95DurationMs)} ms</span></div></div>)}</div> : <p className="py-8 text-center text-sm text-muted">No service traffic in this period.</p>}
          {metrics?.endpoints.length ? <div className="mt-5 border-t border-border pt-4"><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Most requested endpoints</h3><div className="space-y-2">{metrics.endpoints.slice(0, 6).map((endpoint) => <div key={`${endpoint.method}:${endpoint.path}`} className="flex items-start justify-between gap-3 text-xs"><span className="min-w-0 break-all font-mono text-muted">{endpoint.method} {endpoint.path}</span><span className="shrink-0 text-right font-mono">{endpoint.requests} · {Math.round(endpoint.averageDurationMs)} ms{endpoint.failures > 0 && <span className="block text-danger">{endpoint.failures} failures</span>}</span></div>)}</div></div> : null}
        </section>
      </div>
    </section>
  );
}
