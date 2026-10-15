import { Briefcase, Check, GraduationCap } from "lucide-react";
import { useI18n} from "@/lib/i18n";
import { site } from "@/data/site";
import { Reveal } from "@/components/ui";

export function Experience() {
  const { t, pick } = useI18n();
  return (
    <section id="experience" className="section">
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
        </div>
      </div>
    </section>
  );
}