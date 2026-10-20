import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { fetchBlogSchedule, saveBlogSchedule, type BlogSchedule, type BlogScheduleRun } from "@/lib/api";
import { Field, Panel } from "./shared";

const defaultSchedule: BlogSchedule = { enabled: false, timezone: "Asia/Shanghai", postTimes: ["09:00", "21:00"], updatedAt: "" };

function displayRunTime(value: string, timezone: string) {
  try { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(new Date(value)); }
  catch { return new Date(value).toLocaleString(); }
}

function runStatus(run: BlogScheduleRun) {
  if (run.status === "published") return "border-success/30 bg-success/10 text-success";
  if (run.status === "failed") return "border-danger/30 bg-danger/10 text-danger";
  return "border-border bg-surface-2 text-muted";
}

export function BlogAutomationPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["blog-schedule"], queryFn: fetchBlogSchedule, refetchInterval: 30_000 });
  const [draft, setDraft] = useState<BlogSchedule>(defaultSchedule);
  const [dirty, setDirty] = useState(false);
  const [newTime, setNewTime] = useState("12:00");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (query.data?.schedule && !dirty) setDraft(query.data.schedule); }, [query.data?.schedule, dirty]);
  const changeDraft = (update: (current: BlogSchedule) => BlogSchedule) => { setDirty(true); setDraft(update); };
  const save = useMutation({
    mutationFn: () => saveBlogSchedule({ enabled: draft.enabled, timezone: draft.timezone.trim(), postTimes: draft.postTimes }),
    onSuccess: (schedule) => {
      setDraft(schedule);
      setDirty(false);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["blog-schedule"] });
      window.setTimeout(() => setSaved(false), 2500);
    },
  });
  const addTime = () => {
    if (!newTime || draft.postTimes.includes(newTime) || draft.postTimes.length >= 12) return;
    changeDraft((current) => ({ ...current, postTimes: [...current.postTimes, newTime].sort() }));
  };
  const removeTime = (time: string) => {
    changeDraft((current) => ({ ...current, postTimes: current.postTimes.filter((item) => item !== time) }));
  };

  if (query.isLoading) return <Panel title="Blog schedule" desc="Manage when Beari publishes generated blog posts."><div className="card p-8 text-sm text-muted">Loading blog schedule…</div></Panel>;
  return <Panel title="Blog schedule" desc="Set Beari’s daily publishing times and review recent scheduled runs.">
    <div className="max-w-4xl space-y-5">
      {query.isError && <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">Could not load the blog schedule. {(query.error as Error).message}</div>}
      {query.data && <>
        <section className="card space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><h2 className="font-semibold">Automatic publishing</h2><p className="mt-1 text-sm text-muted">The number of posts per day is the number of times in this schedule.</p></div>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={draft.enabled} onChange={(event) => changeDraft((current) => ({ ...current, enabled: event.target.checked }))} />
              {draft.enabled ? "Schedule enabled" : "Schedule paused"}
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Field label="Timezone" hint="Use an IANA time zone, such as Asia/Shanghai or America/New_York.">
              <input className="input" value={draft.timezone} onChange={(event) => changeDraft((current) => ({ ...current, timezone: event.target.value }))} placeholder="Asia/Shanghai" autoComplete="off" />
            </Field>
            <div className="rounded-xl border border-border bg-surface-2/60 px-4 py-3"><p className="text-xs text-muted">Daily post count</p><p className="mt-1 font-display text-2xl font-bold">{draft.postTimes.length}</p><p className="text-xs text-muted">One post at each scheduled time</p></div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-medium">Posting times</h3><span className="text-xs text-muted">{draft.timezone}</span></div>
            <div className="space-y-2">
              {draft.postTimes.map((time) => <div key={time} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2">
                <Clock3 className="h-4 w-4 text-accent" />
                <input aria-label={`Posting time ${time}`} type="time" className="input h-10 max-w-44" value={time} onChange={(event) => { const value = event.target.value; if (value && !draft.postTimes.some((item) => item !== time && item === value)) changeDraft((current) => ({ ...current, postTimes: [...current.postTimes.filter((item) => item !== time), value].sort() })); }} />
                <span className="flex-1 text-xs text-muted">Posts in {draft.timezone}</span>
                <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => removeTime(time)} aria-label={`Remove ${time}`} disabled={draft.postTimes.length <= 1}><Trash2 className="h-4 w-4" /></button>
              </div>)}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Field label="Add a time"><input type="time" className="input h-10 w-36" value={newTime} onChange={(event) => setNewTime(event.target.value)} /></Field>
              <button type="button" className="btn-ghost btn-sm h-10" onClick={addTime} disabled={draft.postTimes.length >= 12 || draft.postTimes.includes(newTime)}><Plus className="h-4 w-4" />Add posting time</button>
            </div>
          </div>
          {save.isError && <p role="alert" className="text-sm text-danger">Could not save schedule: {(save.error as Error).message}</p>}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4"><button type="button" className="btn-primary btn-sm" onClick={() => save.mutate()} disabled={save.isPending || !draft.timezone.trim() || draft.postTimes.length === 0 || new Set(draft.postTimes).size !== draft.postTimes.length}><Save className="h-4 w-4" />{save.isPending ? "Saving…" : saved ? "Schedule saved" : "Save schedule"}{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}</button><p className="text-xs text-muted">Changes are picked up by the backend scheduler within 15 seconds.</p></div>
        </section>
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4"><div><h2 className="font-semibold">Recent runs</h2><p className="mt-1 text-xs text-muted">Latest scheduled post attempts</p></div><button type="button" className="btn-ghost btn-sm" onClick={() => void query.refetch()} disabled={query.isFetching}>{query.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}</button></div>
          {query.data.runs.length ? <div className="divide-y divide-border">{query.data.runs.map((run) => <article key={run.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${runStatus(run)}`}>{run.status}</span><time className="text-xs text-muted">{displayRunTime(run.scheduled_for, draft.timezone)}</time></div>{run.post_slug && <p className="mt-2 truncate text-sm font-medium">{run.article_title || run.post_slug}</p>}{run.source_url && <a className="mt-1 block truncate text-xs text-accent hover:underline" href={run.source_url} target="_blank" rel="noreferrer">{run.source_url}</a>}{run.error_summary && <p className="mt-2 text-xs text-danger">{run.error_summary}</p>}</div>
          </article>)}</div> : <p className="px-5 py-10 text-center text-sm text-muted">No scheduled runs yet. Enable the schedule to start publishing.</p>}
        </section>
      </>}
    </div>
  </Panel>;
}
