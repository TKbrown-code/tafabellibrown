import { useI18n, type DictKey } from "@/lib/i18n";
import { useSkills } from "@/lib/api";
import { site } from "@/data/site";
import type {  SkillCategory } from "@/lib/types";
import { Reveal, Skeleton } from "@/components/ui";


const CATS: { id: SkillCategory; key: DictKey }[] = [
  { id: "frontend", key: "cat_frontend" },
  { id: "backend", key: "cat_backend" },
  { id: "data", key: "cat_data" },
  { id: "devops", key: "cat_devops" },
  { id: "testing", key: "cat_testing" },
];

function Skills() {
  const { t } = useI18n();
  const { data, isLoading } = useSkills();
  return (
    <section id="skills" className="section">
      <div className="container">
        <Reveal>
          <p className="kicker">{t("skills_kicker")}</p>
          <h2 className="h-section">{t("skills_title")}</h2>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATS.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.05}>
              <div className="card h-full p-6" data-testid={`card-skills-${c.id}`}>
                <h3 className="font-sans text-sm font-bold">{t(c.key)}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isLoading
                    ? [1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-7 w-20 rounded-full" />)
                    : data?.filter((s) => s.category === c.id).map((s) => (
                        <span key={s.id} className="rounded-lg bg-surface-2 px-2.5 py-1 text-sm text-ink">{s.name}</span>
                      ))}
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal delay={0.25}>
            <div className="h-full rounded-2xl border border-dashed border-border p-6">
              <h3 className="font-sans text-sm font-bold">{t("methodologies")}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {site.methodologies.map((m) => (
                  <span key={m} className="rounded-lg border border-border px-2.5 py-1 text-sm text-muted">{m}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default Skills;