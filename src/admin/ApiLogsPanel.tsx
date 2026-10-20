import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CircleAlert, ChevronDown, RotateCw } from "lucide-react";
import type { AdminApiLog } from "@/lib/api";

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

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export function ApiLogsPanel({
  logs,
  isLive,
  isLoading,
  isLoadingMore,
  hasMore,
  hasError,
  onRefresh,
  onLoadMore,
}: {
  logs: AdminApiLog[];
  isLive: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  hasError: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
}) {
  const [serviceFilter, setServiceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const services = useMemo(
    () => [...new Set(logs.map((log) => log.service))].sort(),
    [logs],
  );
  const visibleLogs = logs.filter(
    (log) =>
      (serviceFilter === "all" || log.service === serviceFilter) &&
      (typeFilter === "all" || log.type === typeFilter),
  );
  const errors = logs.filter((log) => log.type === "error").length;
  const measuredLogs = logs.filter((log) => log.duration_ms !== null);
  const averageDuration = measuredLogs.length
    ? Math.round(
        measuredLogs.reduce((total, log) => total + (log.duration_ms ?? 0), 0) /
          measuredLogs.length,
      )
    : null;

  return (
    <section className="space-y-6" aria-labelledby="api-logs-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            API observability
          </p>
          <h1 id="api-logs-title" className="mt-1 font-display text-2xl font-bold">
            API logs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Recent request activity, response times, and failures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-muted">
            <span
              className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-500"}`}
            />
            {isLive ? "Live" : "Reconnecting"}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="btn-ghost btn-sm"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Requests shown</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{logs.length}</p>
          <p className="mt-1 text-[11px] text-faint">Most recent entries</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Server errors</p>
          <p className="mt-2 flex items-center gap-2 font-mono text-2xl font-semibold">
            <CircleAlert className="h-5 w-5 text-danger" />
            {errors}
          </p>
          <p className="mt-1 text-[11px] text-faint">HTTP 5xx responses</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted">Average response time</p>
          <p className="mt-2 font-mono text-2xl font-semibold">
            {averageDuration === null ? "—" : `${averageDuration} ms`}
          </p>
          <p className="mt-1 text-[11px] text-faint">Across measured requests</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="api-log-service-filter">Filter by service</label>
        <select
          id="api-log-service-filter"
          className="input h-9 w-auto min-w-36 text-xs"
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
        >
          <option value="all">All services</option>
          {services.map((service) => <option key={service} value={service}>{service}</option>)}
        </select>
        <label className="sr-only" htmlFor="api-log-type-filter">Filter by log type</label>
        <select
          id="api-log-type-filter"
          className="input h-9 w-auto min-w-32 text-xs"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">All types</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {isLoading && logs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Loading API activity…</p>
        ) : hasError && logs.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-danger">
            API logs couldn’t load. Check your connection and admin access.
          </p>
        ) : visibleLogs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            {hasError ? (
              <AlertTriangle className="mx-auto h-5 w-5 text-amber-500" />
            ) : (
              <Activity className="mx-auto h-5 w-5 text-faint" />
            )}
            <p className="mt-3 text-sm text-muted">
              {hasError ? "Could not refresh logs. Showing no matching entries." : "No matching API activity yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleLogs.map((log) => (
              <article key={log.id} className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${rowStyles[log.type]}`}>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${typeStyles[log.type]}`}>
                      {log.type}
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
                      {log.service}
                    </span>
                    {log.method && (
                      <span className="font-mono text-[11px] text-muted">
                        {log.method} {log.path}
                      </span>
                    )}
                  </div>
                  <p className={`break-words text-sm ${messageStyles[log.type]}`}>{log.message}</p>
                  <p className="font-mono text-[10px] text-faint">{formatTimestamp(log.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                  {log.status_code !== null && (
                    <span className={`rounded-lg px-2 py-1 font-mono text-xs ${log.status_code >= 500 ? "bg-danger/10 text-danger" : log.status_code >= 400 ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-surface-2 text-muted"}`}>
                      {log.status_code}
                    </span>
                  )}
                  {log.duration_ms !== null && (
                    <span className="min-w-16 text-right font-mono text-xs text-muted">
                      {log.duration_ms} ms
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {logs.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="btn-ghost btn-sm"
            >
              {isLoadingMore ? "Loading more…" : "View more"}
              <ChevronDown className={`h-3.5 w-3.5 ${isLoadingMore ? "animate-bounce" : ""}`} />
            </button>
          ) : (
            <p className="text-xs text-faint">You’re all caught up with the available logs.</p>
          )}
        </div>
      )}
    </section>
  );
}
