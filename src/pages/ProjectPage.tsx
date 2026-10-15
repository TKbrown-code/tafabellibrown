import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useProjects } from "@/lib/api";
import { ExternalLink, GithubIcon, Reveal, Skeleton, assetUrl } from "@/components/shared/ui";
import {useTitle, Back, prose} from "../components/shared/Layout"
import { NotFound } from "./404";

export function ProjectPage() {
  const { slug } = useParams();
  const { t, loc } = useI18n();
  const { data, isLoading } = useProjects();
  const idx = data?.findIndex((p) => p.slug === slug) ?? -1;
  const p = data?.[idx];
  useTitle(p ? `${p.title} case study` : undefined);

  if (isLoading) return <div className="container py-20"><Skeleton className="h-[60vh]" /></div>;
  if (!p) return <NotFound />;
  const next = data![(idx + 1) % data!.length];

  return (
    <article>
      <header className="container pb-12 pt-10 md:pt-14">
        <Back label={t("back_home")} />
        <Reveal>
          <p className="kicker mt-10">{loc(p.tagline, p.tagline_zh)}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] md:text-6xl" data-testid="text-project-title">{loc(p.title, p.title_zh)}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{loc(p.summary, p.summary_zh)}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <dl className="mt-10 grid gap-6 border-y border-border py-6 text-sm sm:grid-cols-3">
            <div><dt className="font-mono text-[11px] uppercase tracking-wider text-faint">{t("cs_role")}</dt><dd className="mt-1">{loc(p.role, p.role_zh)}</dd></div>
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
            <img src={assetUrl(p.cover_url)} alt={`${p.title} homepage`} className="w-full" />
          </div>
        </Reveal>
      )}

      <section className="container mt-16 grid gap-4 sm:grid-cols-3">
        {p.metrics.map((m) => (
          <Reveal key={m.label}>
            <div className="card p-6">
              <p className="font-display text-4xl font-bold text-accent">{m.value}</p>
              <p className="mt-1 text-sm text-muted">{loc(m.label, m.label_zh)}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <div className="container grid gap-12 py-20 lg:grid-cols-[1fr_2.2fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{t("cs_stack")}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{p.tech.map((x) => <span key={x} className="chip">{x}</span>)}</div>
        </aside>
        <div className="space-y-14">
          {([["cs_challenge", p.problem, p.problem_zh], ["cs_approach", p.approach, p.approach_zh], ["cs_results", p.results, p.results_zh]] as const).map(([k, en, zh], i) => (
            <Reveal key={k}>
              <section>
                <p className="kicker">0{i + 1}</p>
                <h2 className="mt-2 text-2xl font-bold md:text-3xl">{t(k)}</h2>
                <div className={`${prose} mt-5`}><ReactMarkdown remarkPlugins={[remarkGfm]}>{loc(en, zh)}</ReactMarkdown></div>
              </section>
            </Reveal>
          ))}
        </div>
      </div>

      {next && next.slug !== p.slug && (
        <Link to={`/projects/${next.slug}`} className="group block border-t border-border bg-surface/50" data-testid="link-next-project">
          <div className="container flex items-center justify-between gap-6 py-12">
            <div>
              <p className="kicker">{t("cs_next")}</p>
              <p className="mt-2 font-display text-3xl font-bold transition-colors group-hover:text-accent md:text-4xl">{loc(next.title, next.title_zh)}</p>
            </div>
            <ArrowRight className="h-8 w-8 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </div>
        </Link>
      )}
    </article>
  );
}
