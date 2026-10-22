import { ArrowLeft, Layers3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useProjects } from "@/lib/api";
import { Reveal, Skeleton } from "@/components/shared/ui";
import { SEO } from "@/lib/seo";
import { ProjectCard } from "@/sections/home/projectCards";

export function ProjectsPage() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useProjects();
  const backLabel = ({ en: "Back to home", zh: "返回首页", fr: "Retour à l’accueil", es: "Volver al inicio", ar: "العودة إلى الصفحة الرئيسية", pcm: "Back to home" } as const)[lang];
  const title = t("projects_title");
  const description = "Explore Tafa Belli Brown's selected full-stack projects, technical case studies, and the engineering decisions behind each product.";

  return (
    <>
    <SEO title={`${title} | Tafa Belli Brown`} description={description} path="/projects" />
    <main>
      <section className="relative overflow-hidden border-b border-border bg-surface/50">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="container relative py-10 md:py-16">
          <Link to="/" state={{ scrollTo: "projects" }} className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" />{backLabel}</Link>
          <Reveal>
            <div className="mt-12 flex flex-wrap items-end justify-between gap-8 md:mt-16">
              <div className="max-w-3xl">
                <p className="kicker">{t("projects_kicker")}</p>
                <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">{t("projects_title")}</h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">A closer look at the products, engineering decisions, and measurable results behind my work.</p>
              </div>
              {!isLoading && <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted"><Layers3 className="h-4 w-4 text-accent" /><span>{data?.length ?? 0} projects</span></div>}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container py-10 md:py-16" aria-label="Selected projects">
        {isLoading ? <div className="space-y-8">{[1, 2].map((item) => <Skeleton key={item} className="h-80" />)}</div> : data?.length ? <div className="space-y-8 md:space-y-10">{data.map((project, index) => <Reveal key={project.id}><ProjectCard p={project} index={index} /></Reveal>)}</div> : <p className="py-16 text-center text-muted">No projects available yet.</p>}
      </section>
    </main>
    </>
  );
}
