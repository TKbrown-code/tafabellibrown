import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { useI18n,} from "@/lib/i18n"
import { site } from "@/data/site";
import { Reveal, useScrollTo } from "@/components/ui";

function Hero() {
  const { t, pick } = useI18n();
  const scrollTo = useScrollTo();
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-size-[22px_22px] mask-[radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" />
      <div className="container grid items-center gap-14 pb-20 pt-14 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-28">
        <div>
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
            <p className="mt-7 font-mono text-sm text-accent">{site.name} · {pick(site.role)}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-3 font-display text-[2.6rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[4.4rem]">
              {t("hero_title_1")} <span className="text-accent">{t("hero_title_2")}</span> {t("hero_title_3")}
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-xl text-base text-muted md:text-lg">{t("hero_body")}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => scrollTo("projects")} data-testid="button-view-projects">
                {t("cta_projects")} <ArrowRight className="h-4 w-4" />
              </button>
              <a className="btn-ghost" download="Tafa_Belli_Brown_Resume.pdf" href={site.resumeUrl} target="_blank" rel="noopener noreferrer" data-testid="button-download-resume">
                <Download className="h-4 w-4" /> {t("cta_resume")}
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.25}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
              {site.stats.map((s) => (
                <div key={s.value}>
                  <dt className="font-display text-2xl font-bold md:text-3xl">{s.value}</dt>
                  <dd className="mt-1 text-xs leading-snug text-muted">{pick(s.label)}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* Stacked live-project screenshots */}
        <div className="relative mx-auto mt-28 aspect-5/4 w-full max-w-[560px]" aria-label="Featured portfolio projects">
        <div className="absolute inset-0 rounded-4xl border border-border bg-surface shadow-soft ring-1 ring-border/80" />
        <div className="absolute inset-x-0 bottom-0 h-[150%]" style={{ clipPath: "inset(-100% 0 0 0 round 0 0 2rem 2rem)" }}>
        <motion.img
          className="h-full w-full object-cover object-bottom"
          src="/images/me.png"
          alt="Tafa Belli Brown, full-stack developer"
          initial={reduce ? false : { scale: 0.96, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        </div>
      </div>
      </div>
    </section>
  );
}

export default Hero;