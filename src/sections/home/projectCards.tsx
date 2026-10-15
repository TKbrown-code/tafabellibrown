
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Project} from "@/lib/types";
import { ExternalLink, assetUrl } from "@/components/shared/ui";


export function ProjectCard({ p, index }: { p: Project; index: number }) {
  const { t, loc } = useI18n();
  const flip = index % 2 === 1;
  return (
    <article className="card group grid overflow-hidden md:grid-cols-2" data-testid={`card-project-${p.slug}`}>
      <Link to={`/projects/${p.slug}`} className={`relative block overflow-hidden bg-surface-2 ${flip ? "md:order-2" : ""}`} aria-label={loc(p.title, p.title_zh)}>
        {p.cover_url && (
          <img src={assetUrl(p.cover_url)} alt={`${p.title} screenshot`} loading="lazy" className="aspect-16/10 h-full w-full object-cover object-top-left transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        )}
      </Link>
      <div className="flex flex-col p-7 md:p-9">
        <p className="font-mono text-xs text-faint">0{index + 1} · {loc(p.tagline, p.tagline_zh)}</p>
        <h3 className="mt-2 text-2xl font-bold md:text-3xl">{loc(p.title, p.title_zh)}</h3>
        <p className="mt-3 text-muted">{loc(p.summary, p.summary_zh)}</p>
        <dl className="mt-6 grid grid-cols-3 gap-3">
          {p.metrics.slice(0, 3).map((m) => (
            <div key={m.label} className="rounded-xl bg-surface-2 px-3 py-2.5">
              <dt className="font-display text-lg font-bold text-accent">{m.value}</dt>
              <dd className="text-[11px] leading-tight text-muted">{loc(m.label, m.label_zh)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {p.tech.slice(0, 6).map((tch) => <span key={tch} className="chip">{tch}</span>)}
          {p.tech.length > 6 && <span className="chip">+{p.tech.length - 6}</span>}
        </div>
        <div className="mt-auto flex flex-wrap gap-3 pt-7">
          <Link to={`/projects/${p.slug}`} className="btn-primary" data-testid={`link-case-${p.slug}`}>
            {t("read_case")} <ArrowRight className="h-4 w-4" />
          </Link>
          {p.live_url && (
            <ExternalLink href={p.live_url} className="btn-ghost" data-testid={`link-live-${p.slug}`}>
              {t("visit_site")} <ArrowUpRight className="h-4 w-4" />
            </ExternalLink>
          )}
        </div>
      </div>
    </article>
  );
}
