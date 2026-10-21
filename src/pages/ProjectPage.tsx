import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, ArrowUpRight, Code2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProjects } from "@/lib/api";
import { ExternalLink, GithubIcon, Reveal, Skeleton, assetUrl } from "@/components/shared/ui";
import {useTitle, Back, prose} from "../components/shared/Layout"
import { NotFound } from "./404";

const syntaxPattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\/\*.*?\*\/|\/\/.*$|#.*$|--.*$)|(\b(?:as|async|await|break|case|catch|class|const|continue|def|default|delete|do|else|export|extends|false|finally|for|from|function|if|implements|import|in|interface|let|new|null|of|pass|print|private|protected|public|raise|return|static|switch|this|throw|true|try|type|undefined|var|while|with|yield|SELECT|FROM|WHERE|AND|OR|ORDER|BY|LIMIT|OFFSET|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|ON|AS|CREATE|TABLE|INDEX|GROUP|HAVING|DISTINCT|NOT|NULL|IS|ASC|DESC)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Z][A-Za-z0-9_$]*\b)|(\b[A-Za-z_$][\w$]*(?=\s*\())|([{}()[\].,;:])|(=>|===?|!==?|<=?|>=?|&&|\|\||\?\?|\?\.|\+|-|\*|\/|=|!|<|>|\|)/g;

function highlightLine(line: string) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const match of line.matchAll(syntaxPattern)) {
    const value = match[0];
    const start = match.index ?? cursor;
    if (start > cursor) parts.push(line.slice(cursor, start));
    const color = match[1] ? "text-emerald-300" : match[2] ? "text-slate-500 italic" : match[3] ? "text-violet-300" : match[4] ? "text-amber-300" : match[5] ? "text-sky-200" : match[6] ? "text-blue-300" : match[7] ? "text-slate-400" : "text-pink-300";
    parts.push(<span className={color} key={`${start}-${value}`}>{value}</span>);
    cursor = start + value.length;
  }
  if (cursor < line.length) parts.push(line.slice(cursor));
  return parts.length ? parts : " ";
}

function snippetExtension(language: string) {
  const value = language.toLowerCase().replace(/[^a-z0-9+#]/g, "");
  if (value.includes("typescript") || value === "ts") return "ts";
  if (value.includes("javascript") || value === "js") return "js";
  if (value.includes("python") || value === "py") return "py";
  if (value.includes("sql")) return "sql";
  if (value.includes("html")) return "html";
  if (value.includes("css")) return "css";
  if (value.includes("json")) return "json";
  if (value.includes("bash") || value.includes("shell")) return "sh";
  return "txt";
}

function snippetFileName(title: string, index: number, language: string) {
  const stem = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 42);
  return `${stem || `example-${index + 1}`}.${snippetExtension(language)}`;
}

function CodeEditorWindow({ title, language, code, index }: { title: string; language: string; code: string; index: number }) {
  const lines = code.split("\n");
  const fileName = snippetFileName(title, index, language);
  return <article className="min-w-0 max-w-full overflow-hidden rounded-[1.2rem] border border-slate-700/70 bg-[#090d14] shadow-[0_24px_80px_-36px_rgba(0,0,0,.9)] ring-1 ring-black/30">
    <div className="flex h-11 items-center gap-2 border-b border-white/[0.07] bg-[#171c25] px-4">
      <div className="flex items-center gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" /></div>
      <span className="ml-3 hidden min-w-0 flex-1 truncate text-center font-mono text-[10px] text-slate-400 sm:block">{title || `Example ${index + 1}`} — {language || "text"}</span>
      <span className="ml-auto rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-slate-400 sm:ml-0">Preview</span>
    </div>
    <div className="flex h-10 items-end border-b border-white/[0.07] bg-[#10151d] px-3">
      <div className="flex h-9 max-w-full items-center gap-2 border-b-2 border-sky-400 px-3 text-xs text-slate-200"><Code2 className="h-3.5 w-3.5 text-sky-400" /><span className="max-w-[min(60vw,28rem)] truncate font-mono">{fileName}</span><span className="ml-1 text-slate-500">×</span></div>
    </div>
    <div className="flex items-center gap-2 border-b border-white/[0.05] bg-[#0e131b] px-4 py-2 font-mono text-[10px] text-slate-500"><span>projects</span><span className="text-slate-700">/</span><span className="truncate text-slate-400">{fileName}</span><span className="ml-auto shrink-0 text-sky-300/80">{language || "Plain text"}</span></div>
    <div className="max-h-[38rem] w-full min-w-0 max-w-full overflow-auto py-3 font-mono text-[10px] leading-5 text-slate-200 sm:text-[11px] md:text-xs" style={{ scrollbarWidth: "thin" }}>
      <pre className="flex min-w-max"><span aria-hidden="true" className="sticky left-0 z-10 flex w-11 min-w-11 shrink-0 flex-col border-r border-white/[0.06] bg-[#090d14] pr-2.5 text-right text-slate-600">{lines.map((_, lineIndex) => <span className="h-5 leading-5" key={lineIndex}>{lineIndex + 1}</span>)}</span><code className="block">{lines.map((line, lineIndex) => <span className="block h-5 whitespace-pre px-3 leading-5" key={lineIndex}>{highlightLine(line)}</span>)}</code></pre>
    </div>
    <footer className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-[#111720] px-4 py-2 font-mono text-[9px] text-slate-500"><span className="truncate">{title || `Example ${index + 1}`}</span><span className="shrink-0">UTF-8 <span className="px-1.5 text-slate-700">·</span>{lines.length} lines</span></footer>
  </article>;
}

export function ProjectPage() {
  const { slug } = useParams();
  const { t, loc } = useI18n();
  const { data, isLoading } = useProjects();
  const idx = data?.findIndex((p) => p.slug === slug) ?? -1;
  const p = data?.[idx];
  useTitle(
    p
      ? `${loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)} case study`
      : undefined,
    p
      ? loc(p.summary, p.summary_zh, p.summary_fr, p.summary_es, p.summary_ar, p.summary_pcm)
      : undefined,
    { image: p?.cover_url },
  );

  if (isLoading) return <div className="container py-20"><Skeleton className="h-[60vh]" /></div>;
  if (!p) return <NotFound />;
  const next = data![(idx + 1) % data!.length];

  return (
    <article>
      <header className="container min-w-0 pb-10 pt-8 sm:pb-12 sm:pt-10 md:pt-14">
        <Back to="/projects" label={t("projects_kicker")} />
        <Reveal>
          <p className="kicker mt-10">{loc(p.tagline, p.tagline_zh, p.tagline_fr, p.tagline_es, p.tagline_ar, p.tagline_pcm)}</p>
          <h1 className="mt-3 break-words text-3xl font-extrabold leading-[1.05] sm:text-4xl md:text-6xl" data-testid="text-project-title">{loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)}</h1>
          <p className="mt-5 max-w-2xl break-words text-base text-muted sm:text-lg">{loc(p.summary, p.summary_zh, p.summary_fr, p.summary_es, p.summary_ar, p.summary_pcm)}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <dl className="mt-10 grid gap-6 border-y border-border py-6 text-sm sm:grid-cols-3">
            <div><dt className="font-mono text-[11px] uppercase tracking-wider text-faint">{t("cs_role")}</dt><dd className="mt-1">{loc(p.role, p.role_zh, p.role_fr, p.role_es, p.role_ar, p.role_pcm)}</dd></div>
            <div><dt className="font-mono text-[11px] uppercase tracking-wider text-faint">{t("cs_year")}</dt><dd className="mt-1">{p.year}</dd></div>
            <div className="flex flex-wrap items-start gap-2 sm:justify-end">
              {p.live_url && <ExternalLink href={p.live_url} className="btn-primary btn-sm" data-testid="link-live">{t("visit_site")} <ArrowUpRight className="h-3.5 w-3.5" /></ExternalLink>}
              {p.repo_url && <ExternalLink href={p.repo_url} className="btn-ghost btn-sm"><GithubIcon className="h-3.5 w-3.5" /> Code</ExternalLink>}
            </div>
          </dl>
        </Reveal>
      </header>

      {p.cover_url && (
        <Reveal className="container">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
            <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-faint/50" /><span className="h-2.5 w-2.5 rounded-full bg-faint/50" /><span className="h-2.5 w-2.5 rounded-full bg-faint/50" />
              <span className="ml-3 font-mono text-xs text-faint">{p.live_url?.replace(/^https?:\/\//, "")}</span>
            </div>
            <img src={assetUrl(p.cover_url)} alt={`${p.title} homepage`} width={1440} height={900} className="w-full" />
          </div>
        </Reveal>
      )}

      <section className="container mt-16 grid gap-4 sm:grid-cols-3">
        {p.metrics.map((m) => (
          <Reveal key={m.label}>
            <div className="card p-6">
              <p className="font-display text-4xl font-bold text-accent">{m.value}</p>
              <p className="mt-1 text-sm text-muted">{loc(m.label, m.label_zh, m.label_fr, m.label_es, m.label_ar, m.label_pcm)}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <div className="container grid min-w-0 gap-10 py-12 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{t("cs_stack")}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{p.tech.map((x) => <span key={x} className="chip">{x}</span>)}</div>
        </aside>
        <div className="min-w-0 space-y-12 sm:space-y-14">
          {([["cs_challenge", p.problem, p.problem_zh], ["cs_approach", p.approach, p.approach_zh], ["cs_results", p.results, p.results_zh]] as const).map(([k, en, zh], i) => (
            <Reveal key={k}>
              <section>
                <p className="kicker">0{i + 1}</p>
                <h2 className="mt-2 text-2xl font-bold md:text-3xl">{t(k)}</h2>
                <div className={`${prose} mt-5 min-w-0 break-words`}><ReactMarkdown remarkPlugins={[remarkGfm]}>{loc(en, zh, p[`${k === "cs_challenge" ? "problem" : k === "cs_approach" ? "approach" : "results"}_fr` as "problem_fr" | "approach_fr" | "results_fr"], p[`${k === "cs_challenge" ? "problem" : k === "cs_approach" ? "approach" : "results"}_es` as "problem_es" | "approach_es" | "results_es"], p[`${k === "cs_challenge" ? "problem" : k === "cs_approach" ? "approach" : "results"}_ar` as "problem_ar" | "approach_ar" | "results_ar"], p[`${k === "cs_challenge" ? "problem" : k === "cs_approach" ? "approach" : "results"}_pcm` as "problem_pcm" | "approach_pcm" | "results_pcm"])}</ReactMarkdown></div>
              </section>
            </Reveal>
          ))}
        </div>
      </div>

      {!!p.code_snippets?.length && <section className="container min-w-0 mb-14 space-y-6 sm:mb-20 sm:space-y-7" aria-label="Project code snippets">
        <div><p className="kicker">Implementation notes</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Inside the code</h2><p className="mt-2 max-w-2xl text-sm text-muted">Focused examples from the implementation, presented in an editor view.</p></div>
        <div className="grid min-w-0 gap-5 sm:gap-7">{p.code_snippets.map((snippet, index) => <Reveal key={`${snippet.title}-${index}`} className="min-w-0"><CodeEditorWindow title={loc(snippet.title, snippet.title_zh, snippet.title_fr, snippet.title_es, snippet.title_ar, snippet.title_pcm)} language={snippet.language} code={snippet.code} index={index} /></Reveal>)}</div>
      </section>}

      {next && next.slug !== p.slug && (
        <Link to={`/projects/${next.slug}`} className="group block border-t border-border bg-surface/50" data-testid="link-next-project">
          <div className="container flex items-center justify-between gap-6 py-12">
            <div>
              <p className="kicker">{t("cs_next")}</p>
              <p className="mt-2 font-display text-3xl font-bold transition-colors group-hover:text-accent md:text-4xl">{loc(next.title, next.title_zh, next.title_fr, next.title_es, next.title_ar, next.title_pcm)}</p>
            </div>
            <ArrowRight className="h-8 w-8 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </div>
        </Link>
      )}
    </article>
  );
}
