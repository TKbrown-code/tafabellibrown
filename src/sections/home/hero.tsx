import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { site } from "@/data/site";
import { pickSetting, useSiteSettings } from "@/lib/site-settings";
import { Reveal, useScrollTo } from "@/components/shared/ui";

function Hero() {
  const { t, pick, lang } = useI18n();
  const { data: settings } = useSiteSettings();
  const heroTitle = pickSetting(settings, "heroTitleEn", "heroTitleZh", lang).trim();
  const location = pickSetting(settings, "locationEn", "locationZh", lang);
  const heroWords = heroTitle.split(/\s+/);
  const splitAt = lang === "zh" && heroWords.length === 1 ? Math.ceil(heroTitle.length / 2) : Math.max(1, heroWords.length - 3);
  const titleLead = lang === "zh" && heroWords.length === 1 ? heroTitle.slice(0, splitAt) : heroWords.slice(0, splitAt).join(" ");
  const titleAccent = lang === "zh" && heroWords.length === 1 ? heroTitle.slice(splitAt) : heroWords.slice(splitAt).join(" ");
  const scrollTo = useScrollTo();
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-x-clip">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" />
      <div className="container grid items-center gap-9 pb-14 pt-10 sm:gap-12 sm:pb-20 sm:pt-14 md:pt-20 lg:grid-cols-[1.05fr_.95fr] lg:gap-10 lg:pb-28">
        <div className="min-w-0">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-soft" data-testid="status-available">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {t("available")}
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-6 break-words font-mono text-xs text-accent sm:mt-7 sm:text-sm">{settings.name} · {pickSetting(settings, "roleEn", "roleZh", lang)}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-3 max-w-[15ch] font-display text-[clamp(2.25rem,6.5vw,3.75rem)] font-extrabold leading-[1.02] tracking-tight lg:text-[clamp(3.5rem,5.5vw,4.4rem)]">
              {titleLead}{titleLead && titleAccent ? " " : ""}<span className="text-accent">{titleAccent}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted sm:mt-6 sm:text-base md:text-lg">{pickSetting(settings, "heroBodyEn", "heroBodyZh", lang)}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-7 flex flex-col gap-3 min-[480px]:flex-row sm:mt-8">
              <button className="btn-primary" onClick={() => scrollTo("projects")} data-testid="button-view-projects">
                {t("cta_projects")} <ArrowRight className="h-4 w-4" />
              </button>
              <a className="btn-ghost" download="Tafa_Belli_Brown_Resume.pdf" href={settings.resumeUrl || site.resumeUrl} target="_blank" rel="noopener noreferrer" data-testid="button-download-resume">
                <Download className="h-4 w-4" /> {t("cta_resume")}
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.25}>
            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-2 border-t border-border pt-4 sm:mt-12 sm:gap-3 sm:pt-5">
              {site.stats.map((s) => (
                <div key={s.value} className="min-w-0 rounded-2xl border border-border/80 bg-surface/75 p-2.5 shadow-soft sm:p-3.5">
                  <dt className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl md:text-3xl">{s.value}</dt>
                  <dd className="mt-1.5 text-[10px] leading-snug text-muted sm:text-xs">{pick(s.label)}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="relative isolate mx-auto mt-0 aspect-[4/5] w-full max-w-[560px] sm:aspect-5/4 lg:aspect-[4/3] lg:translate-y-12" aria-label="Tafa Belli Brown profile photo">
          <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2.75rem] bg-gradient-to-br from-accent/15 via-accent/5 to-transparent blur-2xl" />
          <div className="absolute inset-0 rounded-4xl border border-border bg-surface shadow-soft ring-1 ring-border/80" />
          <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden rounded-4xl [clip-path:inset(0_0_0_0_round_2rem)] sm:h-[150%] md:h-[180%] sm:overflow-visible sm:rounded-none sm:[clip-path:inset(-100%_0_0_0_round_0_0_2rem_2rem)]">
            <motion.img
              ref={(image) => {
                if (image) image.fetchPriority = "high";
              }}
              className="h-full w-full object-cover object-bottom"
              src={settings.profileImageUrl}
              alt="Tafa Belli Brown, full-stack developer"
              width={560}
              height={747}
              initial={reduce ? false : { scale: 0.96, opacity: 0, y: 14 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="absolute bottom-3 left-3 flex max-w-[calc(100%_-_1.5rem)] items-center gap-2 rounded-2xl border border-border/80 bg-bg/90 px-2.5 py-2 shadow-soft backdrop-blur-md sm:bottom-5 sm:left-5 sm:gap-2.5 sm:px-3.5 sm:py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><MapPin className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted">{lang === "zh" ? "所在地" : "Based in"}</span><span className="block truncate text-xs font-semibold text-ink sm:text-sm">{location}</span></span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
