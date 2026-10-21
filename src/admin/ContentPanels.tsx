import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Check, Code2, FileText, ImagePlus, Loader2, Plus, Save, Sparkles, Star, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModal } from "@/hooks/useModal";
import { deleteServiceScreenshot, suggestAdminContentField, suggestProjectCode, translateAdminFields, uploadContentThumbnail, uploadServiceScreenshot, useAdminDelete, useAdminList, useAdminSave, type ContentSuggestionField, type ContentSuggestionResource } from "@/lib/api";
import type { Metric, Post, Project, Service, Skill, SkillCategory } from "@/lib/types";
import { assetUrl, formatDate } from "@/components/shared/ui";
import { Bi, ConfirmDelete, Drawer, Field, Panel, Status, Table, Toggle, isNew, slugify, stripNew, useEditor } from "./shared";

export type TranslationResource = "projects" | "posts" | "services" | "settings";
export type TranslationResult = Awaited<ReturnType<typeof translateAdminFields>>;

function saveErrorMessage(error: unknown) {
  const value = error as { response?: { data?: { message?: string } }; message?: string };
  return value.response?.data?.message || value.message || "Could not save this content.";
}

function sourceFields(resource: TranslationResource, draft: Project | Post | Service) {
  const keys = resource === "projects" ? ["title", "tagline", "summary", "role", "problem", "approach", "results"] : resource === "posts" ? ["title", "excerpt", "content"] : ["category", "subcategory", "title", "description", "screenshot_alt"];
  const fields = Object.fromEntries(keys.filter((key) => typeof (draft as Record<string, unknown>)[key] === "string" && String((draft as Record<string, unknown>)[key]).trim()).map((key) => [key, (draft as Record<string, unknown>)[key] as string]));
  if (resource === "projects") {
    (draft as Project).metrics.forEach((metric, index) => { if (metric.label.trim()) fields[`metricLabel${index}`] = metric.label; });
    (draft as Project).code_snippets?.forEach((snippet, index) => { if (snippet.title.trim()) fields[`snippetTitle${index}`] = snippet.title; });
  }
  return fields;
}

function mergeTranslations<T extends Project | Post | Service>(draft: T, result: TranslationResult, fingerprint: string): T {
  const merged = { ...draft } as T & Record<string, unknown>;
  for (const locale of ["fr", "zh", "es", "ar", "pcm"] as const) for (const [key, value] of Object.entries(result[locale] ?? {})) {
    const metric = /^metricLabel(\d+)_(fr|zh|es|ar|pcm)$/.exec(key);
    const snippet = /^snippetTitle(\d+)_(fr|zh|es|ar|pcm)$/.exec(key);
    if (metric && Array.isArray(merged.metrics)) {
      const index = Number(metric[1]);
      (merged as Record<string, unknown>).metrics = (merged.metrics as Project["metrics"]).map((item, i) => i === index ? { ...item, [`label_${locale}`]: value } : item);
    } else if (snippet && Array.isArray(merged.code_snippets)) {
      const index = Number(snippet[1]);
      (merged as Record<string, unknown>).code_snippets = (merged.code_snippets as NonNullable<Project["code_snippets"]>).map((item, i) => i === index ? { ...item, [`title_${locale}`]: value } : item);
    } else merged[key] = value;
  }
  merged.__translationSourceFingerprint = fingerprint;
  return merged;
}

export function TranslationReview({ resource, fields, onConfirm }: { resource: TranslationResource; fields: Record<string, string>; onConfirm: (result: TranslationResult, fingerprint: string) => void }) {
  const fingerprint = JSON.stringify(fields);
  const [preview, setPreview] = useState<TranslationResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const translate = useMutation({ mutationFn: () => translateAdminFields(resource, fields), onSuccess: (result) => { setPreview(result); setConfirmed(false); } });
  useEffect(() => { setPreview(null); setConfirmed(false); translate.reset(); }, [fingerprint]);
  const localeNames = { fr: "French", zh: "Chinese", es: "Spanish", ar: "Arabic", pcm: "Nigerian Pidgin" };
  return <section className="rounded-xl border border-border bg-surface-2/50 p-4" aria-label="Translation review"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Review translations before saving</h3><p className="mt-1 text-xs text-muted">Beari creates a preview in five languages. Publishing is enabled after you confirm it.</p></div><button type="button" className="btn-ghost btn-sm" disabled={translate.isPending || !Object.keys(fields).length} onClick={() => translate.mutate()}>{translate.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Translating…</> : "Preview translations"}</button></div>
    {translate.isError && <p role="alert" className="mt-3 text-xs text-danger">Could not generate translations: {(translate.error as Error).message}</p>}
    {preview && <div className="mt-4 space-y-2">{(Object.keys(localeNames) as Array<keyof typeof localeNames>).map((locale) => <details key={locale} className="rounded-lg border border-border bg-surface p-3"><summary className="cursor-pointer text-sm font-medium">{localeNames[locale]}</summary><dl className="mt-3 space-y-3">{Object.entries(preview[locale] ?? {}).map(([key, value]) => <div key={key}><dt className="text-[11px] font-semibold text-muted">{key.replace(/_(fr|zh|es|ar|pcm)$/, "").replace(/^metricLabel(\d+)$/, "Metric label $1")}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{value}</dd></div>)}</dl></details>)}</div>}
    {preview && <div className="mt-4 flex items-center gap-3"><label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> I reviewed these translations</label><button type="button" className="btn-primary btn-sm" disabled={!confirmed} onClick={() => onConfirm(preview, fingerprint)}>Confirm translations</button></div>}
  </section>;
}

function translationReady(draft: Project | Post | Service, resource: TranslationResource) {
  return (draft as (Project | Post | Service) & { __translationSourceFingerprint?: string }).__translationSourceFingerprint === JSON.stringify(sourceFields(resource, draft));
}

function BeariLiveSuggestion({ resource, field, value, context, enabled, onApply }: {
  resource: ContentSuggestionResource;
  field: ContentSuggestionField;
  value: string;
  context: Record<string, string>;
  enabled: boolean;
  onApply: (suggestion: string) => void;
}) {
  const contextJson = JSON.stringify(Object.fromEntries(Object.entries(context).sort(([a], [b]) => a.localeCompare(b))));
  const fingerprint = JSON.stringify({ resource, field, value, contextJson });
  const skippedFingerprint = useRef("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<{ fingerprint: string; text: string } | null>(null);
  const [error, setError] = useState("");
  const minimum = field === "title" ? 4 : field === "content" ? 60 : 18;
  const requiredContext = resource === "services" && field === "description"
    ? Boolean(context.category?.trim() && context.subcategory?.trim() && (context.title?.trim().length ?? 0) >= 3)
    : resource === "projects" && field === "summary"
      ? Boolean((context.title?.trim().length ?? 0) >= 3 && [context.tagline, context.role, context.tech, context.problem, context.approach, context.results].some((item) => item?.trim()))
      : false;
  const canSuggest = requiredContext || value.trim().length >= minimum;

  useEffect(() => {
    if (!enabled || !canSuggest) {
      setLoading(false);
      setSuggestion(null);
      setError("");
      return;
    }
    if (skippedFingerprint.current === fingerprint) {
      skippedFingerprint.current = "";
      setSuggestion(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void suggestAdminContentField({ resource, field, value: value.trim(), context: JSON.parse(contextJson) as Record<string, string> }, controller.signal)
        .then((result) => { if (!controller.signal.aborted) setSuggestion({ fingerprint, text: result.suggestion }); })
        .catch((reason) => { if (!controller.signal.aborted) setError((reason as Error).message || "Beari couldn’t prepare a suggestion."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 1200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [enabled, field, fingerprint, minimum, resource, value, contextJson, canSuggest]);

  if (!enabled || !canSuggest) return null;
  const currentSuggestion = suggestion?.fingerprint === fingerprint ? suggestion.text : "";
  const useSuggestion = () => {
    skippedFingerprint.current = JSON.stringify({ resource, field, value: currentSuggestion, contextJson });
    onApply(currentSuggestion);
    setSuggestion(null);
  };

  return <div className="mt-2 rounded-lg border border-accent/20 bg-accent-soft/40 px-3 py-2.5" aria-live="polite">
    {loading && <p className="flex items-center gap-2 text-xs text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />Beari is preparing a suggestion…</p>}
    {currentSuggestion && <div><details><summary className="cursor-pointer text-xs font-medium text-accent">Beari has a suggestion · Preview</summary><p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm text-ink">{currentSuggestion}</p></details><div className="mt-2 flex gap-2"><button type="button" className="btn-primary btn-sm" onClick={useSuggestion}><Check className="h-3.5 w-3.5" /> Use suggestion</button><button type="button" className="btn-ghost btn-sm" onClick={() => { skippedFingerprint.current = fingerprint; setSuggestion(null); }}>Dismiss</button></div></div>}
    {error && <p className="text-xs text-danger">Beari suggestions are temporarily unavailable.</p>}
  </div>;
}

/* ------------------------------ Projects ----------------------------- */
const blankProject = (): Project => ({
  id: `new-${Date.now()}`, slug: "", title: "", title_zh: "", tagline: "", tagline_zh: "", summary: "", summary_zh: "", role: "", role_zh: "",
  year: String(new Date().getFullYear()), problem: "", problem_zh: "", approach: "", approach_zh: "", results: "", results_zh: "",
  metrics: [], tech: [], code_snippets: [], live_url: "", repo_url: "", cover_url: "", featured: true, published: false, sort_order: 99,
});

function ThumbnailUpload({ value, kind, onChange }: { value?: string | null; kind: "projects" | "blogs"; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { showModal } = useModal();
  const pick = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) { const message = "Choose a JPG, PNG, or WebP image up to 8 MB."; setError(message); showModal({ type: "error", title: "Upload not accepted", description: message }); return; }
    setBusy(true); setError("");
    try { const asset = await uploadContentThumbnail(file, kind); onChange(asset.url); showModal({ type: "success", title: "Thumbnail uploaded", description: "The image is saved in storage and attached to this draft." }); }
    catch (e) { const message = (e as Error).message; setError(message); showModal({ type: "error", title: "Upload failed", description: message }); }
    finally { setBusy(false); }
  };
  return <Field label="Thumbnail · Supabase Storage" hint="Upload JPG, PNG, or WebP, up to 8 MB.">
    <div className="flex flex-wrap items-center gap-3"><input type="file" accept="image/jpeg,image/png,image/webp" className="input min-w-60 flex-1" disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} />{busy && <span className="text-xs text-muted">Uploading…</span>}{value && <img src={assetUrl(value)} alt="Thumbnail preview" className="h-16 w-28 rounded-lg border border-border object-cover" />}</div>
    {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
  </Field>;
}

export function ProjectsPanel() {
  const { showModal } = useModal();
  const { data, isLoading } = useAdminList<Project>("projects");
  const ed = useEditor<Project>("projects", blankProject);
  const [activeSuggestionField, setActiveSuggestionField] = useState<ContentSuggestionField | null>(null);
  const d = ed.draft;
  const projectTranslationFields = d ? sourceFields("projects", d) : {};
  const confirmProjectTranslations = (result: TranslationResult, fingerprint: string) => ed.setDraft((current) => current ? mergeTranslations(current, result, fingerprint) : current);
  const setMetric = (i: number, patch: Partial<Metric>) => d && ed.set("metrics", d.metrics.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const codeSuggestions = useMutation({
    mutationFn: suggestProjectCode,
    onSuccess: (result) => ed.setDraft((current) => current ? { ...current, code_snippets: [...(current.code_snippets ?? []), ...result.suggestions] } : current),
  });

  return (
      <Panel title="Projects" desc="Case studies shown on the home page and their detail pages." action={<button className="btn-primary btn-sm" onClick={() => { setActiveSuggestionField(null); ed.create(); }} data-testid="button-new-project"><Plus className="h-3.5 w-3.5" /> New project</button>}>
      <Table loading={isLoading} empty="No projects yet." rows={data ?? []} render={(p) => (
        <button key={p.id} onClick={() => { setActiveSuggestionField(null); ed.setDraft(structuredClone(p)); }} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2" data-testid={`row-project-${p.slug}`}>
          {p.cover_url ? <img src={assetUrl(p.cover_url)} alt="" className="h-10 w-16 rounded-md object-cover object-top" /> : <div className="h-10 w-16 rounded-md bg-surface-2" />}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.title}</p><p className="truncate text-xs text-muted">{p.tagline}</p></div>
          <Status on={p.published} />
          <span className="w-8 text-right font-mono text-xs text-faint">#{p.sort_order}</span>
        </button>
      )} />
      <Drawer open={!!d} title={d && !isNew(d.id) ? `Edit · ${d.title}` : "New project"} onClose={() => { setActiveSuggestionField(null); ed.setDraft(null); }}
        footer={d && <>
          {!isNew(d.id) && <ConfirmDelete pending={ed.del.isPending} onConfirm={() => ed.del.mutate(d.id, { onSuccess: () => { ed.setDraft(null); showModal({ type: "success", title: "Project deleted", description: "The project was removed from your portfolio." }); }, onError: (error) => showModal({ type: "error", title: "Could not delete project", description: (error as Error).message || "Please try again." }) })} testId="button-delete-project" />}
          {ed.save.isError && <span role="alert" className="max-w-sm text-xs text-danger">{saveErrorMessage(ed.save.error)}</span>}
          <button className="btn-ghost btn-sm" onClick={() => ed.setDraft(null)}>Cancel</button>
          <button className="btn-primary btn-sm" disabled={ed.save.isPending || !d.title || !translationReady(d, "projects")} onClick={() => ed.save.mutate(stripNew({ ...d, slug: d.slug || slugify(d.title) }), { onSuccess: () => ed.setDraft(null) })} data-testid="button-save-project">{ed.save.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Save className="h-3.5 w-3.5" /> Save reviewed content</>}</button>
        </>}>
        {d && <>
          <TranslationReview resource="projects" fields={projectTranslationFields} onConfirm={confirmProjectTranslations} />
          <div className="flex flex-wrap gap-6"><Toggle checked={d.published} onChange={(v) => ed.set("published", v)} label="Published" /><Toggle checked={d.featured} onChange={(v) => ed.set("featured", v)} label="Featured" /></div>
          <Bi obj={d} set={ed.set} k="title" label="Title" onInput={() => setActiveSuggestionField("summary")} />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Slug" hint="Auto from title if empty"><input className="input" value={d.slug} onChange={(e) => ed.set("slug", slugify(e.target.value))} /></Field>
            <Field label="Year"><input className="input" value={d.year} onChange={(e) => ed.set("year", e.target.value)} /></Field>
            <Field label="Sort order"><input type="number" className="input" value={d.sort_order} onChange={(e) => ed.set("sort_order", Number(e.target.value))} /></Field>
          </div>
          <Bi obj={d} set={ed.set} k="tagline" label="Tagline" onInput={() => setActiveSuggestionField("summary")} />
          <Bi obj={d} set={ed.set} k="summary" label="Summary" area rows={3} onInput={() => setActiveSuggestionField("summary")} />
          <BeariLiveSuggestion resource="projects" field="summary" value={d.summary} context={{ title: d.title, tagline: d.tagline, role: d.role, tech: d.tech.join(", "), problem: d.problem, approach: d.approach, results: d.results, year: d.year }} enabled={activeSuggestionField === "summary"} onApply={(suggestion) => { ed.set("summary", suggestion); setActiveSuggestionField(null); }} />
          <Bi obj={d} set={ed.set} k="role" label="Role" onInput={() => setActiveSuggestionField("summary")} />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Live URL"><input className="input" value={d.live_url ?? ""} onChange={(e) => ed.set("live_url", e.target.value)} /></Field>
            <Field label="Repo URL"><input className="input" value={d.repo_url ?? ""} onChange={(e) => ed.set("repo_url", e.target.value)} /></Field>
            <div className="md:col-span-3"><ThumbnailUpload kind="projects" value={d.cover_url} onChange={(url) => ed.set("cover_url", url)} /></div>
          </div>
          <Field label="Tech stack" hint="Comma separated"><input className="input" value={d.tech.join(", ")} onChange={(e) => { ed.set("tech", e.target.value.split(",").map((s) => s.trim()).filter(Boolean)); setActiveSuggestionField("summary"); }} data-testid="input-tech" /></Field>
          <div>
            <div className="mb-2 flex items-center justify-between"><span className="label mb-0">Metrics</span><button type="button" className="btn-ghost btn-sm" onClick={() => ed.set("metrics", [...d.metrics, { value: "", label: "" }])}><Plus className="h-3 w-3" /> Add</button></div>
            <div className="space-y-2">
              {d.metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-[90px_1fr_auto] gap-2">
                  <input className="input" placeholder="40%" value={m.value} onChange={(e) => setMetric(i, { value: e.target.value })} />
                  <input className="input" placeholder="Label" value={m.label} onChange={(e) => setMetric(i, { label: e.target.value })} />
                  <button type="button" className="grid w-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-danger" onClick={() => ed.set("metrics", d.metrics.filter((_, j) => j !== i))} aria-label="Remove metric"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <section className="space-y-4 rounded-2xl border border-border bg-surface-2/50 p-4">
            <div><h3 className="flex items-center gap-2 text-sm font-semibold"><Code2 className="h-4 w-4 text-accent" /> Project notebook</h3><p className="mt-1 text-xs text-muted">Write the case study in Markdown and add focused code examples. Beari translates snippet titles; source code stays unchanged.</p></div>
            <p className="text-xs text-faint">Case study sections support Markdown.</p>
          <Bi obj={d} set={ed.set} k="problem" label="The challenge" area rows={5} />
          <Bi obj={d} set={ed.set} k="approach" label="What I did" area rows={8} />
          <Bi obj={d} set={ed.set} k="results" label="Results" area rows={4} />
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><span className="label mb-0">Code snippets</span><p className="mt-1 text-[11px] text-muted">Draft a focused example from this project, then review and edit it.</p></div><div className="flex flex-wrap gap-2"><button type="button" className="btn-ghost btn-sm" disabled={codeSuggestions.isPending || !d.title.trim() || ![d.problem, d.approach, d.results].some((value) => value.trim())} onClick={() => codeSuggestions.mutate({ title: d.title.trim(), tech: d.tech, problem: d.problem, approach: d.approach, results: d.results, existingTitles: (d.code_snippets ?? []).map((snippet) => snippet.title) })}><Sparkles className="h-3.5 w-3.5" />{codeSuggestions.isPending ? "Beari is drafting…" : "Suggest with Beari"}</button><button type="button" className="btn-ghost btn-sm" onClick={() => ed.set("code_snippets", [...(d.code_snippets ?? []), { title: "", language: "typescript", code: "" }])}><Plus className="h-3.5 w-3.5" /> Add snippet</button></div></div>
              {codeSuggestions.isError && <p role="alert" className="text-xs text-danger">Beari couldn’t draft a code example: {(codeSuggestions.error as Error).message}</p>}
              {codeSuggestions.isSuccess && <p role="status" className="text-xs text-success">Beari added a draft below. Check its accuracy and edit it before saving.</p>}
              {(d.code_snippets ?? []).map((snippet, index) => <div key={index} className="space-y-2 rounded-xl border border-border bg-surface p-3"><div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]"><input className="input" placeholder="Example title" value={snippet.title} onChange={(e) => ed.set("code_snippets", (d.code_snippets ?? []).map((item, i) => i === index ? { ...item, title: e.target.value } : item))} /><input className="input" placeholder="Language" value={snippet.language} onChange={(e) => ed.set("code_snippets", (d.code_snippets ?? []).map((item, i) => i === index ? { ...item, language: e.target.value } : item))} /><button type="button" aria-label="Remove snippet" className="btn-ghost btn-sm text-danger" onClick={() => ed.set("code_snippets", (d.code_snippets ?? []).filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></button></div><textarea className="input min-h-36 font-mono text-xs leading-relaxed" spellCheck={false} placeholder="Paste a focused, readable example" value={snippet.code} onChange={(e) => ed.set("code_snippets", (d.code_snippets ?? []).map((item, i) => i === index ? { ...item, code: e.target.value } : item))} /></div>)}
            </div>
          </section>
        </>}
      </Drawer>
    </Panel>
  );
}

/* -------------------------------- Posts ------------------------------ */
const blankPost = (): Post => ({ id: `new-${Date.now()}`, slug: "", title: "", title_zh: "", excerpt: "", excerpt_zh: "", content: "", content_zh: "", tags: [], cover_url: null, reading_minutes: 4, published: false, published_at: new Date().toISOString() });

export function PostsPanel() {
  const { showModal } = useModal();
  const { data, isLoading } = useAdminList<Post>("posts");
  const ed = useEditor<Post>("posts", blankPost);
  const [activeSuggestionField, setActiveSuggestionField] = useState<ContentSuggestionField | null>(null);
  const d = ed.draft;
  const postTranslationFields = d ? sourceFields("posts", d) : {};
  const confirmPostTranslations = (result: TranslationResult, fingerprint: string) => ed.setDraft((current) => current ? mergeTranslations(current, result, fingerprint) : current);
  return (
    <Panel title="Blog posts" desc="Write in English and Markdown. Beari suggests improvements as you draft and translates into five languages when you save." action={<button className="btn-primary btn-sm" onClick={() => { setActiveSuggestionField(null); ed.create(); }} data-testid="button-new-post"><Plus className="h-3.5 w-3.5" /> New post</button>}>
      <Table loading={isLoading} empty="No posts yet — write your first one." rows={data ?? []} render={(p) => (
        <button key={p.id} onClick={() => { setActiveSuggestionField(null); ed.setDraft(structuredClone(p)); }} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2" data-testid={`row-post-${p.slug}`}>
          {p.cover_url ? <img src={assetUrl(p.cover_url)} alt="" className="h-10 w-16 rounded-md object-cover" /> : <FileText className="h-4 w-4 shrink-0 text-faint" />}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{p.title}</p><p className="truncate text-xs text-muted">{p.tags.join(" · ")}</p></div>
          <Status on={p.published} />
          <span className="hidden w-28 text-right font-mono text-xs text-faint sm:block">{formatDate(p.published_at, "en")}</span>
        </button>
      )} />
      <Drawer open={!!d} title={d && !isNew(d.id) ? `Edit · ${d.title}` : "New post"} onClose={() => { setActiveSuggestionField(null); ed.setDraft(null); }}
        footer={d && <>
          {!isNew(d.id) && <ConfirmDelete pending={ed.del.isPending} onConfirm={() => ed.del.mutate(d.id, { onSuccess: () => { ed.setDraft(null); showModal({ type: "success", title: "Blog post deleted", description: "The post was removed from your published content." }); }, onError: (error) => showModal({ type: "error", title: "Could not delete blog post", description: (error as Error).message || "Please try again." }) })} testId="button-delete-post" />}
          {ed.save.isError && <span role="alert" className="max-w-sm text-xs text-danger">{saveErrorMessage(ed.save.error)}</span>}
          <button className="btn-ghost btn-sm" onClick={() => ed.setDraft(null)}>Cancel</button>
          <button className="btn-primary btn-sm" disabled={ed.save.isPending || !d.title || !translationReady(d, "posts")} onClick={() => ed.save.mutate(stripNew({ ...d, slug: d.slug || slugify(d.title), reading_minutes: Math.max(1, Math.round(d.content.split(/\s+/).length / 220)) }), { onSuccess: () => ed.setDraft(null) })} data-testid="button-save-post">{ed.save.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Save className="h-3.5 w-3.5" /> Save reviewed content</>}</button>
        </>}>
        {d && <>
          <TranslationReview resource="posts" fields={postTranslationFields} onConfirm={confirmPostTranslations} />
          <Toggle checked={d.published} onChange={(v) => ed.set("published", v)} label="Published" />
          <Bi obj={d} set={ed.set} k="title" label="Title" onInput={() => setActiveSuggestionField("title")} />
          <BeariLiveSuggestion resource="posts" field="title" value={d.title} context={{ excerpt: d.excerpt, content: d.content, tags: d.tags.join(", ") }} enabled={activeSuggestionField === "title"} onApply={(suggestion) => { ed.set("title", suggestion); setActiveSuggestionField(null); }} />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Slug" hint="Auto from title if empty"><input className="input" value={d.slug} onChange={(e) => ed.set("slug", slugify(e.target.value))} /></Field>
            <Field label="Publish date"><input type="date" className="input" value={(d.published_at ?? "").slice(0, 10)} onChange={(e) => ed.set("published_at", new Date(e.target.value).toISOString())} /></Field>
            <Field label="Tags" hint="Comma separated"><input className="input" value={d.tags.join(", ")} onChange={(e) => ed.set("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></Field>
          </div>
          <Bi obj={d} set={ed.set} k="excerpt" label="Excerpt" area rows={2} onInput={() => setActiveSuggestionField("excerpt")} />
          <BeariLiveSuggestion resource="posts" field="excerpt" value={d.excerpt} context={{ title: d.title, content: d.content, tags: d.tags.join(", ") }} enabled={activeSuggestionField === "excerpt"} onApply={(suggestion) => { ed.set("excerpt", suggestion); setActiveSuggestionField(null); }} />
          <ThumbnailUpload kind="blogs" value={d.cover_url} onChange={(url) => ed.set("cover_url", url)} />
          <Bi obj={d} set={ed.set} k="content" label="Content (Markdown)" area rows={16} onInput={() => setActiveSuggestionField("content")} />
          <BeariLiveSuggestion resource="posts" field="content" value={d.content} context={{ title: d.title, excerpt: d.excerpt, tags: d.tags.join(", ") }} enabled={activeSuggestionField === "content"} onApply={(suggestion) => { ed.set("content", suggestion); setActiveSuggestionField(null); }} />
        </>}
      </Drawer>
    </Panel>
  );
}

/* -------------------------------- Skills ----------------------------- */
const CATS: SkillCategory[] = ["frontend", "backend", "data", "devops", "testing"];

export function SkillsPanel() {
  const { showModal } = useModal();
  const { data, isLoading } = useAdminList<Skill>("skills");
  const save = useAdminSave<Skill>("skills");
  const del = useAdminDelete("skills");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SkillCategory>("frontend");
  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const count = Math.max(-1, ...(data ?? []).filter((s) => s.category === newCategory).map((s) => s.sort_order)) + 1;
    save.mutate({ category: newCategory, name, sort_order: count, is_primary: false }, { onSuccess: () => { setNewName(""); setAddOpen(false); } });
  };
  const primarySkills = (data ?? []).filter((skill) => skill.is_primary).sort((a, b) => a.sort_order - b.sort_order);
  const reorder = async (category: SkillCategory, id: string, direction: -1 | 1) => {
    const items = (data ?? []).filter((skill) => skill.category === category).sort((a, b) => a.sort_order - b.sort_order);
    const index = items.findIndex((skill) => skill.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    await Promise.all(items.map((skill, position) => save.mutateAsync({ ...skill, sort_order: position })));
  };
  return (
    <Panel title="Skills" desc="Choose the primary stack and arrange skills in the order visitors see them." action={<button type="button" className="btn-primary btn-sm" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" /> Add skill</button>}>
      {primarySkills.length > 0 && <div className="card mb-4 p-5"><h2 className="font-semibold">Primary stack</h2><p className="mt-1 text-xs text-muted">These skills are highlighted above the category lists on the public site.</p><div className="mt-3 flex flex-wrap gap-2">{primarySkills.map((skill) => <span key={skill.id} className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent-soft px-2.5 py-1 text-sm font-medium text-accent"><Star className="h-3.5 w-3.5 fill-current" />{skill.name}</span>)}</div></div>}
      <div className="grid gap-4 md:grid-cols-2">
        {CATS.map((c) => (
          <div key={c} className="card p-5" data-testid={`panel-skills-${c}`}>
            <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{c}</p>
            <div className="mt-3 flex min-h-8 flex-wrap gap-1.5">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-faint" /> : [...(data ?? [])].filter((s) => s.category === c).sort((a, b) => a.sort_order - b.sort_order).map((s, index, items) => (
                <span key={s.id} className="inline-flex items-center gap-0.5 rounded-lg bg-surface-2 py-1 pl-2.5 pr-1 text-sm">
                  <span>{s.name}</span>
                  <button type="button" onClick={() => save.mutate({ ...s, is_primary: !s.is_primary })} className={`grid h-6 w-6 place-items-center rounded-sm hover:bg-border ${s.is_primary ? "text-accent" : "text-faint hover:text-accent"}`} aria-label={`${s.is_primary ? "Remove" : "Mark"} ${s.name} ${s.is_primary ? "from" : "as"} primary`} title={s.is_primary ? "Remove from primary stack" : "Add to primary stack"}><Star className={`h-3 w-3 ${s.is_primary ? "fill-current" : ""}`} /></button>
                  <button type="button" disabled={index === 0 || save.isPending} onClick={() => void reorder(c, s.id, -1)} className="grid h-6 w-6 place-items-center rounded-sm text-faint hover:bg-border hover:text-ink disabled:opacity-30" aria-label={`Move ${s.name} up`}><ArrowUp className="h-3 w-3" /></button>
                  <button type="button" disabled={index === items.length - 1 || save.isPending} onClick={() => void reorder(c, s.id, 1)} className="grid h-6 w-6 place-items-center rounded-sm text-faint hover:bg-border hover:text-ink disabled:opacity-30" aria-label={`Move ${s.name} down`}><ArrowDown className="h-3 w-3" /></button>
                  <button type="button" disabled={del.isPending} onClick={() => del.mutate(s.id, { onSuccess: () => showModal({ type: "success", title: "Skill removed", description: `${s.name} was removed from your skills.` }), onError: (error) => showModal({ type: "error", title: "Could not remove skill", description: (error as Error).message || "Please try again." }) })} className="grid h-6 w-6 place-items-center rounded-sm text-faint hover:bg-border hover:text-danger disabled:opacity-50" aria-label={`Remove ${s.name}`}>{del.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="border border-border bg-surface text-ink sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a skill</DialogTitle>
            <DialogDescription className="text-muted">Choose a category, then add the skill to your portfolio.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); add(); }}>
            <label className="block space-y-1.5 text-sm"><span className="label">Category</span><select className="input" value={newCategory} onChange={(event) => setNewCategory(event.target.value as SkillCategory)}>{CATS.map((category) => <option key={category} value={category}>{category[0].toUpperCase() + category.slice(1)}</option>)}</select></label>
            <label className="block space-y-1.5 text-sm"><span className="label">Skill name</span><input className="input" placeholder="e.g. TypeScript" value={newName} onChange={(event) => setNewName(event.target.value)} /></label>
            {save.isError && <p role="alert" className="text-sm text-danger">{(save.error as Error).message}</p>}
            <DialogFooter><button type="button" className="btn-ghost btn-sm" onClick={() => setAddOpen(false)}>Cancel</button><button type="submit" className="btn-primary btn-sm" disabled={!newName.trim() || save.isPending}>{save.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding…</> : <><Plus className="h-3.5 w-3.5" /> Add skill</>}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

/* ------------------------------ Services ----------------------------- */
const blankService = (): Service => ({ id: `new-${Date.now()}`, category: "Development", subcategory: "Web development", title: "", description: "", screenshot_path: null, screenshot_alt: "", sort_order: 1, published: false });

export function ServicesPanel() {
  const { data, isLoading } = useAdminList<Service>("services");
  const ed = useEditor<Service>("services", blankService);
  const [activeSuggestionField, setActiveSuggestionField] = useState<ContentSuggestionField | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [originalScreenshot, setOriginalScreenshot] = useState<string | null>(null);
  const { showModal } = useModal();
  const d = ed.draft;
  const serviceTranslationFields = d ? sourceFields("services", d) : {};
  const confirmServiceTranslations = (result: TranslationResult, fingerprint: string) => ed.setDraft((current) => current ? mergeTranslations(current, result, fingerprint) : current);
  const screenshotUrl = d?.screenshot_url ?? "";
  const upload = async (file?: File) => {
    if (!file || !d) return;
    setUploadError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { const message = "Choose a JPG, PNG, or WebP image."; setUploadError(message); showModal({ type: "error", title: "Upload not accepted", description: message }); return; }
    if (file.size > 8 * 1024 * 1024) { const message = "The screenshot must be 8 MB or smaller."; setUploadError(message); showModal({ type: "error", title: "Upload not accepted", description: message }); return; }
    setUploading(true);
    try {
      const uploaded = await uploadServiceScreenshot(file);
      ed.set("screenshot_path", uploaded.screenshot_path);
      ed.set("screenshot_url", uploaded.screenshot_url);
      ed.set("screenshot_alt", d.screenshot_alt || file.name.replace(/\.[^.]+$/, ""));
      showModal({ type: "success", title: "Screenshot uploaded", description: "The screenshot is saved in storage and attached to this service draft." });
    } catch (error) { const message = (error as Error).message; setUploadError(message); showModal({ type: "error", title: "Upload failed", description: message }); }
    finally { setUploading(false); }
  };
  const removeService = async () => {
    if (!d) return;
    ed.del.mutate(d.id, { onSuccess: () => { ed.setDraft(null); showModal({ type: "success", title: "Service deleted", description: "The service was removed from your portfolio." }); }, onError: (error) => showModal({ type: "error", title: "Could not delete service", description: (error as Error).message || "Please try again." }) });
  };
  const closeEditor = () => {
    if (d?.screenshot_path && d.screenshot_path !== originalScreenshot) void deleteServiceScreenshot(d.screenshot_path).catch(() => undefined);
    ed.setDraft(null);
  };

  return (
    <Panel title="Services" desc="Organize services into categories and subcategories, then add screenshot examples. Beari suggests title and description improvements as you draft." action={<button className="btn-primary btn-sm" onClick={() => { setActiveSuggestionField(null); setOriginalScreenshot(null); setUploadError(""); ed.create(); }} data-testid="button-new-service"><Plus className="h-3.5 w-3.5" /> New service</button>}>
      <Table loading={isLoading} empty="No services yet. Add your first service." rows={[...(data ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title))} render={(s) => (
        <button key={s.id} onClick={() => { setActiveSuggestionField(null); setUploadError(""); setOriginalScreenshot(s.screenshot_path); ed.setDraft(structuredClone(s)); }} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-surface-2" data-testid={`row-service-${s.id}`}>
          {s.screenshot_url ? <img src={s.screenshot_url} alt="" className="h-10 w-16 rounded-md object-cover" /> : <div className="grid h-10 w-16 place-items-center rounded-md bg-surface-2"><ImagePlus className="h-4 w-4 text-faint" /></div>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.title || "Untitled service"}</p><p className="truncate text-xs text-muted">{s.category} · {s.subcategory}</p></div><Status on={s.published} /><span className="w-8 text-right font-mono text-xs text-faint">#{(data ?? []).filter((item) => item.sort_order < s.sort_order || item.sort_order === s.sort_order && item.title.localeCompare(s.title) < 0).length + 1}</span>
        </button>
      )} />
      <Drawer open={!!d} title={d && !isNew(d.id) ? `Edit · ${d.title}` : "New service"} onClose={() => { if (!uploading) { setActiveSuggestionField(null); closeEditor(); } }} footer={d && <>
        {!isNew(d.id) && !uploading && <ConfirmDelete pending={ed.del.isPending} onConfirm={removeService} testId="button-delete-service" />}
        {(ed.save.isError || uploadError) && <span className="max-w-sm text-xs text-danger">{uploadError || (ed.save.error as Error).message}</span>}
        <button className="btn-ghost btn-sm" disabled={uploading} onClick={closeEditor}>Cancel</button>
        <button className="btn-primary btn-sm" disabled={ed.save.isPending || uploading || !d.title.trim() || !d.category.trim() || !d.subcategory.trim() || !translationReady(d, "services")} onClick={() => ed.save.mutate(stripNew(d), { onSuccess: async () => { if (originalScreenshot && originalScreenshot !== d.screenshot_path) await deleteServiceScreenshot(originalScreenshot).catch(() => undefined); setOriginalScreenshot(d.screenshot_path); ed.setDraft(null); } })} data-testid="button-save-service">{ed.save.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Save className="h-3.5 w-3.5" /> Save reviewed content</>}</button>
      </>}>
        {d && <>
          <TranslationReview resource="services" fields={serviceTranslationFields} onConfirm={confirmServiceTranslations} />
          <Toggle checked={d.published} onChange={(v) => ed.set("published", v)} label="Published" />
          <div className="grid gap-3 md:grid-cols-2"><Field label="Category"><input className="input" value={d.category} onChange={(e) => { ed.set("category", e.target.value); setActiveSuggestionField("description"); }} placeholder="Development" /></Field><Field label="Subcategory"><input className="input" value={d.subcategory} onChange={(e) => { ed.set("subcategory", e.target.value); setActiveSuggestionField("description"); }} placeholder="Web development" /></Field></div>
          <Field label="Service title"><input className="input" value={d.title} onChange={(e) => { ed.set("title", e.target.value); setActiveSuggestionField("description"); }} /></Field>
          <Field label="Description"><textarea className="input min-h-28" value={d.description} onChange={(e) => { ed.set("description", e.target.value); setActiveSuggestionField("description"); }} /></Field>
          <BeariLiveSuggestion resource="services" field="description" value={d.description} context={{ category: d.category, subcategory: d.subcategory, title: d.title }} enabled={activeSuggestionField === "description"} onApply={(suggestion) => { ed.set("description", suggestion); setActiveSuggestionField(null); }} />
          <Field label="Sort order"><input type="number" className="input" value={d.sort_order} onChange={(e) => ed.set("sort_order", Number(e.target.value))} /></Field>
          <Field label="Screenshot example" hint="JPG, PNG, or WebP · up to 8 MB"><input className="input" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} data-testid="input-service-screenshot" /></Field>
          {uploading && <p className="text-xs text-muted">Uploading screenshot…</p>}
          {uploadError && <p className="text-xs text-danger" role="alert">{uploadError}</p>}
          {screenshotUrl && <img src={screenshotUrl} alt={d.screenshot_alt || "Screenshot preview"} className="max-h-64 w-full rounded-xl border border-border object-contain" />}
          <Field label="Screenshot alt text" hint="Describe what the screenshot shows for accessibility"><input className="input" value={d.screenshot_alt} onChange={(e) => ed.set("screenshot_alt", e.target.value)} /></Field>
        </>}
      </Drawer>
    </Panel>
  );
}
