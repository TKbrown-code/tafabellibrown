import { Briefcase, Check, GraduationCap } from "lucide-react";
import { useI18n} from "@/lib/i18n";
import { site } from "@/data/site";
import { ExternalLink, Reveal } from "@/components/shared/ui";
import { useProjects } from "@/lib/api";
import { Link } from "react-router-dom";

export function Experience() {
  const { t, pick, loc } = useI18n();
  const { data: projects = [] } = useProjects();
  return (
    <section id="experience" className="section border-t border-border bg-surface/50">
      <div className="container grid gap-12 lg:grid-cols-[1fr_2fr]">
        <Reveal>
          <p className="kicker">{t("experience_kicker")}</p>
          <h2 className="h-section">{t("experience_title")}</h2>
        </Reveal>
        <div className="space-y-6">
          {site.experience.map((e) => (
            <Reveal key={e.title.en}>
              <div className="relative border-l border-border pl-8">
                <span className="absolute left-[-13px] top-0 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-accent">
                  <Briefcase className="h-3 w-3" />
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-sans text-lg font-bold">{pick(e.title)}</h3>
                  <span className="font-mono text-xs text-faint">{pick(e.period)}</span>
                </div>
                <p className="text-sm text-muted">{pick(e.org)} · {pick(e.place)}</p>
                <ul className="mt-5 space-y-3">
                  {e.points.map((pt) => (
                    <li key={pt.en} className="flex gap-3 text-muted">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      <span>{pick(pt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
          <Reveal>
            <div className="relative border-l border-dashed border-border pl-8">
              <span className="absolute left-[-13px] top-0 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-accent">
                <GraduationCap className="h-3 w-3" />
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-sans text-lg font-bold">{pick(site.education.degree)}</h3>
                <span className="font-mono text-xs text-faint">{pick(site.education.period)}</span>
              </div>
              <p className="text-sm text-muted">{pick(site.education.school)} · {pick(site.education.place)}</p>
            </div>
          </Reveal>
          {!!projects.length && <Reveal>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="font-sans text-sm font-bold">{t("experience_projects")}</h3>
              <ul className="mt-3 divide-y divide-border">
                {projects.map((project) => <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0"><p className="font-medium text-ink">{loc(project.title, project.title_zh, project.title_fr, project.title_es, project.title_ar, project.title_pcm)}</p><p className="text-xs text-muted">{loc(project.role, project.role_zh, project.role_fr, project.role_es, project.role_ar, project.role_pcm)} · {project.year}</p></div>
                  <div className="flex shrink-0 gap-3 text-xs"><Link className="link" to={`/projects/${project.slug}`}>{t("read_case")}</Link>{project.live_url && <ExternalLink className="link" href={project.live_url}>{t("visit_site")}</ExternalLink>}</div>
                </li>)}
              </ul>
            </div>
          </Reveal>}
        </div>
      </div>
    </section>
  );
}
