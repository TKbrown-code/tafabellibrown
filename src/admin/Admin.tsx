import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Session } from "@supabase/supabase-js";
import { ArrowLeft, Eye, EyeOff, FileText, FolderKanban, Inbox, Loader2, LogOut, Mail, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { supabase, isDemo } from "@/lib/supabase";
import { useAdminDelete, useAdminList, useAdminSave } from "@/lib/api";
import type { Message, Metric, Post, Project, Skill, SkillCategory } from "@/lib/types";
import { Logo, assetUrl, formatDate } from "@/components/ui";
import { ThemeToggle } from "@/components/Layout";

/* ------------------------------- Auth -------------------------------- */
function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [demoUser, setDemoUser] = useState(false);
  const [ready, setReady] = useState(isDemo);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      if (password !== "demo") throw new Error("Demo mode: use password “demo”.");
      setDemoUser(true);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };
  const signOut = async () => { if (supabase) await supabase.auth.signOut(); setDemoUser(false); };
  return { ready, user: isDemo ? (demoUser ? { email: "demo@portfolio" } : null) : session?.user ?? null, signIn, signOut };
}

function Login({ onSignIn }: { onSignIn: (e: string, p: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await onSignIn(email, password); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <form onSubmit={submit} className="card w-full max-w-sm p-8" data-testid="form-login">
        <Logo className="h-10 w-10" />
        <h1 className="mt-6 font-sans text-xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Manage projects, posts, skills and messages.</p>
        {isDemo && (
          <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent">Demo mode (Supabase not connected). Any email, password <b>demo</b>. Changes are kept in memory only.</p>
        )}
        <div className="mt-6 space-y-4">
          <div><label className="label" htmlFor="a-email">Email</label><input id="a-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-admin-email" /></div>
          <div><label className="label" htmlFor="a-pass">Password</label><input id="a-pass" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required data-testid="input-admin-password" /></div>
        </div>
        {err && <p className="mt-3 text-xs text-danger" role="alert">{err}</p>}
        <button className="btn-primary mt-6 w-full" disabled={busy} data-testid="button-admin-login">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in</button>
        <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-xs text-muted hover:text-ink"><ArrowLeft className="h-3 w-3" /> Back to site</Link>
      </form>
    </div>
  );
}

/* ----------------------------- Primitives ---------------------------- */
function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-faint">{hint}</p>}
    </div>
  );
}

type Setter<T> = <K extends keyof T>(k: K, v: T[K]) => void;

function Bi<T extends Record<string, unknown>>({ obj, set, k, label, area, rows = 4 }: { obj: T; set: Setter<T>; k: keyof T & string; label: string; area?: boolean; rows?: number }) {
  const zk = `${k}_zh` as keyof T & string;
  const C = area ? "textarea" : "input";
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label={`${label} · EN`}>
        <C className="input" rows={area ? rows : undefined} value={(obj[k] as string) ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => set(k, e.target.value as T[typeof k])} data-testid={`input-${k}`} />
      </Field>
      <Field label={`${label} · 中文`}>
        <C className="input" rows={area ? rows : undefined} value={(obj[zk] as string) ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => set(zk, e.target.value as T[typeof zk])} data-testid={`input-${zk}`} />
      </Field>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-border"}`}>
        <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      {label}
    </label>
  );
}

function Drawer({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside role="dialog" aria-label={title} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-border bg-bg shadow-lift" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-sans text-base font-bold">{title}</h2>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Close" data-testid="button-close-drawer"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">{children}</div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ConfirmDelete({ onConfirm, testId }: { onConfirm: () => void; testId: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  return (
    <button type="button" className={`btn-sm btn mr-auto ${armed ? "bg-danger text-white" : "btn-ghost text-danger"}`} onClick={() => (armed ? onConfirm() : setArmed(true))} data-testid={testId}>
      <Trash2 className="h-3.5 w-3.5" /> {armed ? "Click again to delete" : "Delete"}
    </button>
  );
}

function useEditor<T extends { id: string }>(table: "projects" | "posts", blank: () => T) {
  const [draft, setDraft] = useState<T | null>(null);
  const save = useAdminSave<T>(table);
  const del = useAdminDelete(table);
  const set: Setter<T> = (k, v) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  return { draft, setDraft, set, save, del, create: () => setDraft(blank()) };
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const isNew = (id: string) => id.startsWith("new-");
const stripNew = <T extends { id: string }>(d: T) => (isNew(d.id) ? { ...d, id: undefined } : d) as Partial<T> & { id?: string };

/* ------------------------------ Projects ----------------------------- */
const blankProject = (): Project => ({
  id: `new-${Date.now()}`, slug: "", title: "", title_zh: "", tagline: "", tagline_zh: "", summary: "", summary_zh: "", role: "", role_zh: "",
  year: String(new Date().getFullYear()), problem: "", problem_zh: "", approach: "", approach_zh: "", results: "", results_zh: "",
  metrics: [], tech: [], live_url: "", repo_url: "", cover_url: "", featured: true, published: false, sort_order: 99,
});

function ProjectsPanel() {
  const { data, isLoading } = useAdminList<Project>("projects");
  const ed = useEditor<Project>("projects", blankProject);
  const d = ed.draft;
  const setMetric = (i: number, patch: Partial<Metric>) => d && ed.set("metrics", d.metrics.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <Panel title="Projects" desc="Case studies shown on the home page and their detail pages." action={<button className="btn-primary btn-sm" onClick={ed.create} data-testid="button-new-project"><Plus className="h-3.5 w-3.5" /> New project</button>}>
      <Table loading={isLoading} empty="No projects yet." rows={data ?? []} render={(p) => (
        <button key={p.id} onClick={() => ed.setDraft(structuredClone(p))} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2" data-testid={`row-project-${p.slug}`}>
          {p.cover_url ? <img src={assetUrl(p.cover_url)} alt="" className="h-10 w-16 rounded-md object-cover object-top" /> : <div className="h-10 w-16 rounded-md bg-surface-2" />}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.title}</p><p className="truncate text-xs text-muted">{p.tagline}</p></div>
          <Status on={p.published} />
          <span className="w-8 text-right font-mono text-xs text-faint">#{p.sort_order}</span>
        </button>
      )} />
      <Drawer open={!!d} title={d && !isNew(d.id) ? `Edit · ${d.title}` : "New project"} onClose={() => ed.setDraft(null)}
        footer={d && <>
          {!isNew(d.id) && <ConfirmDelete onConfirm={() => ed.del.mutate(d.id, { onSuccess: () => ed.setDraft(null) })} testId="button-delete-project" />}
          {ed.save.isError && <span className="text-xs text-danger">{(ed.save.error as Error).message}</span>}
          <button className="btn-ghost btn-sm" onClick={() => ed.setDraft(null)}>Cancel</button>
          <button className="btn-primary btn-sm" disabled={ed.save.isPending || !d.title} onClick={() => ed.save.mutate(stripNew({ ...d, slug: d.slug || slugify(d.title) }), { onSuccess: () => ed.setDraft(null) })} data-testid="button-save-project">{ed.save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
        </>}>
        {d && <>
          <div className="flex flex-wrap gap-6"><Toggle checked={d.published} onChange={(v) => ed.set("published", v)} label="Published" /><Toggle checked={d.featured} onChange={(v) => ed.set("featured", v)} label="Featured" /></div>
          <Bi obj={d} set={ed.set} k="title" label="Title" />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Slug" hint="Auto from title if empty"><input className="input" value={d.slug} onChange={(e) => ed.set("slug", slugify(e.target.value))} /></Field>
            <Field label="Year"><input className="input" value={d.year} onChange={(e) => ed.set("year", e.target.value)} /></Field>
            <Field label="Sort order"><input type="number" className="input" value={d.sort_order} onChange={(e) => ed.set("sort_order", Number(e.target.value))} /></Field>
          </div>
          <Bi obj={d} set={ed.set} k="tagline" label="Tagline" />
          <Bi obj={d} set={ed.set} k="summary" label="Summary" area rows={3} />
          <Bi obj={d} set={ed.set} k="role" label="Role" />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Live URL"><input className="input" value={d.live_url ?? ""} onChange={(e) => ed.set("live_url", e.target.value)} /></Field>
            <Field label="Repo URL"><input className="input" value={d.repo_url ?? ""} onChange={(e) => ed.set("repo_url", e.target.value)} /></Field>
            <Field label="Cover image URL" hint="Supabase Storage or /public path"><input className="input" value={d.cover_url ?? ""} onChange={(e) => ed.set("cover_url", e.target.value)} /></Field>
          </div>
          <Field label="Tech stack" hint="Comma separated"><input className="input" value={d.tech.join(", ")} onChange={(e) => ed.set("tech", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} data-testid="input-tech" /></Field>
          <div>
            <div className="mb-2 flex items-center justify-between"><span className="label mb-0">Metrics</span><button type="button" className="btn-ghost btn-sm" onClick={() => ed.set("metrics", [...d.metrics, { value: "", label: "", label_zh: "" }])}><Plus className="h-3 w-3" /> Add</button></div>
            <div className="space-y-2">
              {d.metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-[90px_1fr_1fr_auto] gap-2">
                  <input className="input" placeholder="40%" value={m.value} onChange={(e) => setMetric(i, { value: e.target.value })} />
                  <input className="input" placeholder="Label" value={m.label} onChange={(e) => setMetric(i, { label: e.target.value })} />
                  <input className="input" placeholder="中文标签" value={m.label_zh ?? ""} onChange={(e) => setMetric(i, { label_zh: e.target.value })} />
                  <button type="button" className="grid w-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-danger" onClick={() => ed.set("metrics", d.metrics.filter((_, j) => j !== i))} aria-label="Remove metric"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <p className="border-t border-border pt-5 text-xs text-faint">Case study sections support Markdown.</p>
          <Bi obj={d} set={ed.set} k="problem" label="The challenge" area rows={5} />
          <Bi obj={d} set={ed.set} k="approach" label="What I did" area rows={8} />
          <Bi obj={d} set={ed.set} k="results" label="Results" area rows={4} />
        </>}
      </Drawer>
    </Panel>
  );
}

/* -------------------------------- Posts ------------------------------ */
const blankPost = (): Post => ({ id: `new-${Date.now()}`, slug: "", title: "", title_zh: "", excerpt: "", excerpt_zh: "", content: "", content_zh: "", tags: [], cover_url: null, reading_minutes: 4, published: false, published_at: new Date().toISOString() });

function PostsPanel() {
  const { data, isLoading } = useAdminList<Post>("posts");
  const ed = useEditor<Post>("posts", blankPost);
  const d = ed.draft;
  return (
    <Panel title="Blog posts" desc="Write in Markdown, in English and Chinese." action={<button className="btn-primary btn-sm" onClick={ed.create} data-testid="button-new-post"><Plus className="h-3.5 w-3.5" /> New post</button>}>
      <Table loading={isLoading} empty="No posts yet — write your first one." rows={data ?? []} render={(p) => (
        <button key={p.id} onClick={() => ed.setDraft(structuredClone(p))} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2" data-testid={`row-post-${p.slug}`}>
          <FileText className="h-4 w-4 shrink-0 text-faint" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.title}</p><p className="truncate text-xs text-muted">{p.tags.join(" · ")}</p></div>
          <Status on={p.published} />
          <span className="hidden w-28 text-right font-mono text-xs text-faint sm:block">{formatDate(p.published_at, "en")}</span>
        </button>
      )} />
      <Drawer open={!!d} title={d && !isNew(d.id) ? `Edit · ${d.title}` : "New post"} onClose={() => ed.setDraft(null)}
        footer={d && <>
          {!isNew(d.id) && <ConfirmDelete onConfirm={() => ed.del.mutate(d.id, { onSuccess: () => ed.setDraft(null) })} testId="button-delete-post" />}
          {ed.save.isError && <span className="text-xs text-danger">{(ed.save.error as Error).message}</span>}
          <button className="btn-ghost btn-sm" onClick={() => ed.setDraft(null)}>Cancel</button>
          <button className="btn-primary btn-sm" disabled={ed.save.isPending || !d.title} onClick={() => ed.save.mutate(stripNew({ ...d, slug: d.slug || slugify(d.title), reading_minutes: Math.max(1, Math.round(d.content.split(/\s+/).length / 220)) }), { onSuccess: () => ed.setDraft(null) })} data-testid="button-save-post">{ed.save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
        </>}>
        {d && <>
          <Toggle checked={d.published} onChange={(v) => ed.set("published", v)} label="Published" />
          <Bi obj={d} set={ed.set} k="title" label="Title" />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Slug" hint="Auto from title if empty"><input className="input" value={d.slug} onChange={(e) => ed.set("slug", slugify(e.target.value))} /></Field>
            <Field label="Publish date"><input type="date" className="input" value={(d.published_at ?? "").slice(0, 10)} onChange={(e) => ed.set("published_at", new Date(e.target.value).toISOString())} /></Field>
            <Field label="Tags" hint="Comma separated"><input className="input" value={d.tags.join(", ")} onChange={(e) => ed.set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></Field>
          </div>
          <Bi obj={d} set={ed.set} k="excerpt" label="Excerpt" area rows={2} />
          <Bi obj={d} set={ed.set} k="content" label="Content (Markdown)" area rows={16} />
        </>}
      </Drawer>
    </Panel>
  );
}

/* -------------------------------- Skills ----------------------------- */
const CATS: SkillCategory[] = ["frontend", "backend", "data", "devops", "testing"];

function SkillsPanel() {
  const { data, isLoading } = useAdminList<Skill>("skills");
  const save = useAdminSave<Skill>("skills");
  const del = useAdminDelete("skills");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const add = (c: SkillCategory) => {
    const name = inputs[c]?.trim();
    if (!name) return;
    const count = data?.filter((s) => s.category === c).length ?? 0;
    save.mutate({ category: c, name, sort_order: count }, { onSuccess: () => setInputs((i) => ({ ...i, [c]: "" })) });
  };
  return (
    <Panel title="Skills" desc="Grouped skill tags on the home page.">
      <div className="grid gap-4 md:grid-cols-2">
        {CATS.map((c) => (
          <div key={c} className="card p-5" data-testid={`panel-skills-${c}`}>
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{c}</p>
            <div className="mt-3 flex min-h-8 flex-wrap gap-1.5">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-faint" /> : data?.filter((s) => s.category === c).map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 rounded-lg bg-surface-2 py-1 pl-2.5 pr-1 text-sm">
                  {s.name}
                  <button onClick={() => del.mutate(s.id)} className="grid h-5 w-5 place-items-center rounded-sm text-faint hover:bg-border hover:text-danger" aria-label={`Remove ${s.name}`}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(c); }}>
              <input className="input py-2" placeholder="Add skill" value={inputs[c] ?? ""} onChange={(e) => setInputs((i) => ({ ...i, [c]: e.target.value }))} data-testid={`input-skill-${c}`} />
              <button className="btn-ghost btn-sm" aria-label="Add skill"><Plus className="h-3.5 w-3.5" /></button>
            </form>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------- Messages ---------------------------- */
function MessagesPanel() {
  const { data, isLoading } = useAdminList<Message>("messages");
  const save = useAdminSave<Message>("messages");
  const del = useAdminDelete("messages");
  const [openId, setOpenId] = useState<string | null>(null);
  const open = data?.find((m) => m.id === openId) ?? data?.[0];

  useEffect(() => {
    if (open && !open.is_read) save.mutate({ id: open.id, is_read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  return (
    <Panel title="Messages" desc="Submissions from the contact form.">
      {isLoading ? <div className="card h-64 animate-pulse" /> : !data?.length ? (
        <div className="card grid place-items-center p-16 text-center"><Inbox className="h-8 w-8 text-faint" /><p className="mt-3 font-medium">Inbox zero</p><p className="text-sm text-muted">New messages from your contact form will appear here.</p></div>
      ) : (
        <div className="card grid overflow-hidden md:grid-cols-[300px_1fr]">
          <ul className="max-h-[560px] divide-y divide-border overflow-y-auto border-b border-border md:border-b-0 md:border-r">
            {data.map((m) => (
              <li key={m.id}>
                <button onClick={() => setOpenId(m.id)} className={`w-full px-4 py-3 text-left transition-colors ${open?.id === m.id ? "bg-accent-soft" : "hover:bg-surface-2"}`} data-testid={`row-message-${m.id}`}>
                  <div className="flex items-center gap-2">
                    {!m.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    <p className={`truncate text-sm ${m.is_read ? "" : "font-bold"}`}>{m.name}</p>
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-faint">{formatDate(m.created_at, "en")}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted">{m.subject || m.body}</p>
                </button>
              </li>
            ))}
          </ul>
          {open && (
            <div className="p-6" data-testid="panel-message">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-sans text-lg font-bold">{open.subject || "(no subject)"}</h3><p className="text-sm text-muted">{open.name} · <a className="link" href={`mailto:${open.email}`}>{open.email}</a></p></div>
                <div className="flex gap-2">
                  <a className="btn-primary btn-sm" href={`mailto:${open.email}?subject=${encodeURIComponent("Re: " + (open.subject || "Your message"))}`}><Mail className="h-3.5 w-3.5" /> Reply</a>
                  <button className="btn-ghost btn-sm" onClick={() => save.mutate({ id: open.id, is_read: !open.is_read })}>{open.is_read ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {open.is_read ? "Mark unread" : "Mark read"}</button>
                  <button className="btn-ghost btn-sm text-danger" onClick={() => del.mutate(open.id, { onSuccess: () => setOpenId(null) })} aria-label="Delete message"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed">{open.body}</p>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/* --------------------------------- Shell ----------------------------- */
function Panel({ title, desc, action, children }: { title: string; desc: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-sans text-xl font-bold">{title}</h1><p className="text-sm text-muted">{desc}</p></div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Table<T extends { id: string }>({ rows, render, loading, empty }: { rows: T[]; render: (r: T) => ReactNode; loading: boolean; empty: string }) {
  if (loading) return <div className="card h-48 animate-pulse" />;
  if (!rows.length) return <div className="card p-12 text-center text-sm text-muted">{empty}</div>;
  return <div className="card divide-y divide-border overflow-hidden">{rows.map(render)}</div>;
}

function Status({ on }: { on: boolean }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${on ? "bg-success/10 text-success" : "bg-surface-2 text-muted"}`}>{on ? "Published" : "Draft"}</span>;
}

type Tab = "messages" | "projects" | "posts" | "skills";

export default function Admin() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("messages");
  const messages = useAdminList<Message>("messages");
  const unread = useMemo(() => messages.data?.filter((m) => !m.is_read).length ?? 0, [messages.data]);
  useEffect(() => { document.title = "Admin | Tafa Belli Brown"; }, []);

  if (!auth.ready) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-faint" /></div>;
  if (!auth.user) return <Login onSignIn={auth.signIn} />;

  const tabs: { id: Tab; label: string; icon: ReactNode; badge?: number }[] = [
    { id: "messages", label: "Messages", icon: <Inbox className="h-4 w-4" />, badge: unread },
    { id: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
    { id: "posts", label: "Blog", icon: <FileText className="h-4 w-4" /> },
    { id: "skills", label: "Skills", icon: <Sparkles className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-bg md:grid md:grid-cols-[232px_1fr]">
      <aside className="border-b border-border bg-surface md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center gap-2.5 px-5 py-5"><Logo className="h-7 w-7" /><div><p className="text-sm font-bold leading-tight">Portfolio CMS</p><p className="text-[11px] text-muted">{isDemo ? "Demo mode" : "Supabase"}</p></div></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0" aria-label="Admin">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`} className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${tab === t.id ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"}`}>
              {t.icon} {t.label}
              {!!t.badge && <span className="ml-auto rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-ink">{t.badge}</span>}
            </button>
          ))}
          <Link to="/" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted md:hidden"><ArrowLeft className="h-4 w-4" /> Site</Link>
          <button onClick={auth.signOut} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted md:hidden"><LogOut className="h-4 w-4" /> Sign out</button>
        </nav>
        <div className="hidden px-3 md:absolute md:bottom-4 md:left-0 md:right-0 md:block">
          <p className="truncate px-3 pb-2 text-[11px] text-faint">{auth.user.email}</p>
          <div className="flex items-center gap-2 px-1">
            <Link to="/" className="btn-ghost btn-sm flex-1"><ArrowLeft className="h-3.5 w-3.5" /> Site</Link>
            <ThemeToggle />
            <button onClick={auth.signOut} className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted hover:text-ink" aria-label="Sign out" data-testid="button-signout"><LogOut className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
        {isDemo && <div className="mb-6 rounded-xl border border-accent/20 bg-accent-soft px-4 py-3 text-xs text-accent">Demo mode — connect Supabase (set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>) to save changes permanently.</div>}
        {tab === "messages" && <MessagesPanel />}
        {tab === "projects" && <ProjectsPanel />}
        {tab === "posts" && <PostsPanel />}
        {tab === "skills" && <SkillsPanel />}
      </main>
    </div>
  );
}
