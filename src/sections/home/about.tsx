import { GraduationCap, Languages, MapPin} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { site } from "@/data/site"
import { Reveal, } from "@/components/shared/ui";
import { Fact } from "@/components/shared/fact";

function About() {
  const { t, pick } = useI18n();
  return (
    <section id="about" className="section border-t border-border bg-surface/50">
      <div className="container grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <p className="kicker">{t("about_kicker")}</p>
          <h2 className="h-section">{t("about_title")}</h2>
          <div className="mt-6 max-w-2xl space-y-4 text-muted">
            <p>{t("about_p1")}</p>
            <p>{t("about_p2")}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card divide-y divide-border">
            <Fact icon={<MapPin className="h-4 w-4" />} label={t("based_in")}>
              {pick(site.location)}
            </Fact>
            <Fact icon={<GraduationCap className="h-4 w-4" />} label={t("education")}>
              <span className="block font-medium text-ink">{pick(site.education.degree)}</span>
              <span className="block">{pick(site.education.school)} · {pick(site.education.period)}</span>
            </Fact>
            <Fact icon={<Languages className="h-4 w-4" />} label={t("languages")}>
              <div className="flex flex-wrap gap-2">
                {site.languages.map((l) => (
                  <span key={l.en} className="chip">
                    <span className="mr-1 text-ink">{pick(l)}</span> · {pick(l.level)}
                  </span>
                ))}
              </div>
            </Fact>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default About;