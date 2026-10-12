import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Briefcase, Check, Copy, Download, GraduationCap, Languages, Mail, MapPin, Send } from "lucide-react";
import { useI18n, type DictKey } from "@/lib/i18n";
import { usePosts, useProjects, useSendMessage, useSkills } from "@/lib/api";
import { site } from "@/data/site";
import type { Project, SkillCategory } from "@/lib/types";
import { ExternalLink, Reveal, Skeleton, assetUrl, formatDate, useScrollTo } from "@/components/ui";
import { Socials } from "@/components/Layout";

/* ------------------------------- Hero ------------------------------- */
function Hero() {
  const { t, pick } = useI18n();
  const scrollTo = useScrollTo();
  const reduce = useReducedMotion();
  const shots = ["dream-scholarships", "tsogobis", "trucksszone"];

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" />
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
              <a className="btn-ghost" href={site.resumeUrl} target="_blank" rel="noopener noreferrer" data-testid="button-download-resume">
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
        <div className="relative mx-auto aspect-[5/4] w-full max-w-[560px]" aria-hidden>
          {shots.map((s, i) => (
            <motion.div
              key={s}
              initial={reduce ? false : { opacity: 0, y: 30, rotate: 0 }}
              animate={{ opacity: 1, y: 0, rotate: [-5, 3, -1][i] }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="absolute overflow-hidden rounded-xl border border-border bg-surface shadow-lift"
              style={{ width: "78%", left: ["0%", "22%", "10%"][i], top: ["2%", "18%", "40%"][i], zIndex: i + 1 }}
            >
              <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-faint/50" />
                <span className="h-2 w-2 rounded-full bg-faint/50" />
                <span className="h-2 w-2 rounded-full bg-faint/50" />
                <span className="ml-2 truncate font-mono text-[10px] text-faint">{s === "dream-scholarships" ? "dream-scholarships.com" : `${s}.com`}</span>
              </div>
              <img src={assetUrl(`projects/${s}.jpg`)} alt="" className="aspect-[16/10] w-full object-cover object-top" loading={i === 0 ? "eager" : "lazy"} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- About ------------------------------ */
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

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">{icon}</span>
      <div className="min-w-0 text-sm text-muted">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-faint">{label}</p>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------- Skills ----------------------------- */
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

/* ------------------------------ Projects ---------------------------- */
export function ProjectCard({ p, index }: { p: Project; index: number }) {
  const { t, loc } = useI18n();
  const flip = index % 2 === 1;
  return (
    <article className="card group grid overflow-hidden md:grid-cols-2" data-testid={`card-project-${p.slug}`}>
      <Link to={`/projects/${p.slug}`} className={`relative block overflow-hidden bg-surface-2 ${flip ? "md:order-2" : ""}`} aria-label={loc(p.title, p.title_zh)}>
        {p.cover_url && (
          <img src={assetUrl(p.cover_url)} alt={`${p.title} screenshot`} loading="lazy" className="aspect-[16/10] h-full w-full object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
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

function Projects() {
  const { t } = useI18n();
  const { data, isLoading } = useProjects();
  return (
    <section id="projects" className="section border-t border-border bg-surface/50">
      <div className="container">
        <Reveal>
          <p className="kicker">{t("projects_kicker")}</p>
          <h2 className="h-section">{t("projects_title")}</h2>
        </Reveal>
        <div className="mt-12 space-y-8">
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

/* ----------------------------- Experience --------------------------- */
function Experience() {
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
                <span className="absolute -left-[13px] top-0 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-accent">
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
              <span className="absolute -left-[13px] top-0 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-accent">
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

/* -------------------------------- Blog ------------------------------ */
function BlogPreview() {
  const { t, loc, lang } = useI18n();
  const { data, isLoading } = usePosts();
  return (
    <section id="blog" className="section border-t border-border bg-surface/50">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="kicker">{t("blog_kicker")}</p>
            <h2 className="h-section">{t("blog_title")}</h2>
          </Reveal>
          <Link to="/blog" className="btn-ghost" data-testid="link-all-posts">
            {t("all_posts")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {isLoading && [1, 2].map((k) => <Skeleton key={k} className="h-56" />)}
          {data?.slice(0, 2).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.06}>
              <Link to={`/blog/${p.slug}`} className="card group flex h-full flex-col p-7 transition-shadow hover:shadow-lift" data-testid={`card-post-${p.slug}`}>
                <div className="flex items-center gap-3 font-mono text-xs text-faint">
                  <span>{formatDate(p.published_at, lang)}</span>
                  <span>·</span>
                  <span>{p.reading_minutes} {t("min_read")}</span>
                </div>
                <h3 className="mt-3 text-xl font-bold leading-snug transition-colors group-hover:text-accent">{loc(p.title, p.title_zh)}</h3>
                <p className="mt-3 text-sm text-muted">{loc(p.excerpt, p.excerpt_zh)}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-6">
                  {p.tags.map((tg) => <span key={tg} className="chip">{tg}</span>)}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Contact ---------------------------- */
function Contact() {
  const { t } = useI18n();
  const send = useSendMessage();
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("f_required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("f_invalid_email");
    if (!form.body.trim()) e.body = t("f_required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    send.mutate(form, { onSuccess: () => setForm({ name: "", email: "", subject: "", body: "" }) });
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(site.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
    "aria-invalid": !!errors[k],
  });

  return (
    <section id="contact" className="section">
      <div className="container grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <p className="kicker">{t("contact_kicker")}</p>
          <h2 className="h-section">{t("contact_title")}</h2>
          <p className="mt-5 max-w-md text-muted">{t("contact_body")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`mailto:${site.email}`} className="btn-ghost" data-testid="link-email">
              <Mail className="h-4 w-4" /> {site.email}
            </a>
            <button onClick={copy} className="btn-ghost btn-sm" data-testid="button-copy-email" aria-label={t("copy_email")}>
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />} {copied ? t("copied") : t("copy_email")}
            </button>
          </div>
          <Socials className="mt-6" />
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={submit} noValidate className="card space-y-4 p-6 md:p-8" data-testid="form-contact">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="c-name">{t("f_name")} *</label>
                <input id="c-name" className="input" autoComplete="name" {...field("name")} data-testid="input-name" />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="c-email">{t("f_email")} *</label>
                <input id="c-email" type="email" className="input" autoComplete="email" {...field("email")} data-testid="input-email" />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="c-subject">{t("f_subject")}</label>
              <input id="c-subject" className="input" {...field("subject")} data-testid="input-subject" />
            </div>
            <div>
              <label className="label" htmlFor="c-body">{t("f_message")} *</label>
              <textarea id="c-body" rows={5} className="input resize-y" {...field("body")} data-testid="input-message" />
              {errors.body && <p className="mt-1 text-xs text-danger">{errors.body}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button type="submit" className="btn-primary" disabled={send.isPending} data-testid="button-send">
                <Send className="h-4 w-4" /> {send.isPending ? t("f_sending") : t("f_send")}
              </button>
              {send.isSuccess && <p className="text-sm text-success" role="status" data-testid="status-sent">{t("f_sent")}</p>}
              {send.isError && <p className="text-sm text-danger" role="alert">{t("f_error")}</p>}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Experience />
      <BlogPreview />
      <Contact />
    </>
  );
}
