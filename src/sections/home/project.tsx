import { useI18n, } from "@/lib/i18n";
import { useProjects } from "@/lib/api";
import { Reveal, Skeleton} from "@/components/ui";
import {ProjectCard} from "./projectCards"

export function Projects() {
  const { t } = useI18n();
  const { data, isLoading } = useProjects();
  return (
    <section id="projects" className="section border-t border-border bg-surface/50">
      <div className="container">
        <Reveal>
          <p className="kicker">{t("projects_kicker")}</p>
          <h2 className="h-section">{t("projects_title")}</h2>
        </Reveal>
        <div className="mt-12 space-y-8 ">
          {isLoading && [1, 2].map((k) => <Skeleton key={k} className="h-80" />)}
          {data?.map((p, i) => (
            <Reveal key={p.id}>
              <ProjectCard p={p} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}