import { GraduationCap, Languages, MapPin} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Reveal, } from "@/components/shared/ui";
import { Fact } from "@/components/shared/fact";
import { pickSetting, useSiteSettings } from "@/lib/site-settings";
import { site } from "@/data/site";

function About() {
  const { t, pick, lang } = useI18n();
  const { data: settings } = useSiteSettings();
  return (
    <section id="about" className="section border-t border-border bg-surface/50">
      <div className="container grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <p className="kicker">{t("about_kicker")}</p>
          <h2 className="h-section">{pickSetting(settings, "aboutTitleEn", "aboutTitleZh", lang)}</h2>
          <div className="mt-6 max-w-2xl space-y-4 text-muted">
            <p>{pickSetting(settings, "aboutBody1En", "aboutBody1Zh", lang)}</p>
            <p>{pickSetting(settings, "aboutBody2En", "aboutBody2Zh", lang)}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="card divide-y divide-border">
            <Fact icon={<MapPin className="h-4 w-4" />} label={t("based_in")}>
              {pickSetting(settings, "locationEn", "locationZh", lang)}
            </Fact>
            <Fact icon={<GraduationCap className="h-4 w-4" />} label={t("education")}>
              <span className="block font-medium text-ink">{pickSetting(settings, "educationDegreeEn", "educationDegreeZh", lang)}</span>
              <span className="block">{pickSetting(settings, "educationSchoolEn", "educationSchoolZh", lang)} · {pickSetting(settings, "educationPlaceEn", "educationPlaceZh", lang)}</span>
              <span className="block text-xs text-muted">{pickSetting(settings, "educationPeriodEn", "educationPeriodZh", lang)}</span>
            </Fact>
            <Fact icon={<Languages className="h-4 w-4" />} label={t("languages")}>
              <div className="flex flex-wrap gap-2">
                {site.languages.map((l) => (
                  <span key={l.en} className="chip">
                    <span className="me-1 text-ink">{pick(l)}</span> · {pick(l.level)}
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
