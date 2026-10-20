import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, Download, Globe2, Menu, Moon, Sun, X } from "lucide-react";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { site } from "@/data/site";
import { ADMIN_ROUTE } from "@/lib/admin-route";
import { useSiteSettings } from "@/lib/site-settings";
import { ExternalLink, GithubIcon, LinkedinIcon, Logo, useScrollTo } from "./ui";

const NAV: { id: string; key: DictKey }[] = [
  { id: "about", key: "nav_about" },
  { id: "skills", key: "nav_skills" },
  { id: "projects", key: "nav_projects" },
  { id: "services", key: "nav_services" },
  { id: "experience", key: "nav_experience" },
  { id: "blog", key: "nav_blog" },
  { id: "contact", key: "nav_contact" },
];

export function LangToggle() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labels = [
    { value: "en", name: "English", short: "EN" },
    { value: "fr", name: "Français", short: "FR" },
    { value: "zh", name: "中文", short: "中文" },
    { value: "es", name: "Español", short: "ES" },
    { value: "ar", name: "العربية", short: "ع" },
    { value: "pcm", name: "Pidgin", short: "PCM" },
  ] as const;
  const selected = labels.find((option) => option.value === lang) ?? labels[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        id="language-select"
        aria-label={`Language: ${selected.name}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="language-options"
        onClick={() => setOpen((value) => !value)}
        data-testid="select-language"
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-ink shadow-sm transition-colors hover:border-accent/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <Globe2 className="h-3.5 w-3.5 text-muted" />
        <span>{selected.short}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id="language-options" role="listbox" aria-label="Choose language" className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl">
        {labels.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={lang === option.value}
            onClick={() => { setLang(option.value); setOpen(false); triggerRef.current?.focus(); }}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${lang === option.value ? "bg-accent/10 font-semibold text-accent" : "text-ink hover:bg-surface-2"}`}
          >
            <span>{option.name}</span>
            {lang === option.value && <Check className="h-4 w-4" />}
          </button>
        ))}
      </div>}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button onClick={toggle} aria-label={t("theme")} data-testid="button-theme" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Header() {
  const { t } = useI18n();
  const scrollTo = useScrollTo();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (pathname !== "/") { setActiveSection(""); return; }
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.2, 0.5] });
    NAV.forEach(({ id }) => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, [pathname]);

  const go = (id: string) => {
    const wasOpen = open;
    setOpen(false);
    if (id === "services" && pathname !== "/services") { navigate("/services"); return; }
    if (id === "blog" && pathname.startsWith("/blog")) { navigate("/", { state: { scrollTo: id } }); return; }
    // wait for the mobile menu to collapse so the smooth scroll isn't interrupted
    if (wasOpen) setTimeout(() => scrollTo(id), 280);
    else scrollTo(id);
  };

  return (
    <header className={`sticky top-0 z-40 transition-[background,border-color,backdrop-filter] duration-300 ${scrolled || open ? "border-b border-border bg-bg/85 backdrop-blur-md" : "border-b border-transparent"}`}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" data-testid="link-home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Logo />
          <span className="hidden whitespace-nowrap font-display text-[1.05rem] font-bold tracking-tight sm:inline">{settings.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.id} href={n.id === "services" ? "/services" : pathname === "/" ? `#${n.id}` : `/#${n.id}`} onClick={(event) => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); go(n.id); }} aria-current={activeSection === n.id ? "location" : undefined} data-testid={`link-nav-${n.id}`} className={`rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-surface-2 hover:text-ink ${activeSection === n.id ? "bg-surface-2 text-ink" : "text-muted"}`}>
              {t(n.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <a href={settings.resumeUrl || site.resumeUrl} download="Tafa_Belli_Brown_Resume.pdf" target="_blank" rel="noopener noreferrer" title={t("cta_resume")} aria-label={t("cta_resume")} className="group hidden h-10 items-center gap-2 rounded-full border border-accent/25 bg-accent/10 pl-1.5 pr-3.5 text-xs font-semibold text-accent shadow-sm transition-all hover:border-accent hover:bg-accent hover:text-accent-ink hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:inline-flex" data-testid="button-resume-header">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-accent-ink transition-colors group-hover:bg-white/15"><Download className="h-3.5 w-3.5" /></span>
            <span>CV</span>
          </a>
          <button className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface lg:hidden" onClick={() => setOpen((o) => !o)} aria-label={t("menu")} aria-expanded={open} data-testid="button-menu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden lg:hidden" aria-label="Mobile">
            <div className="container flex flex-col gap-1 pb-4">
              {NAV.map((n) => (
                <a key={n.id} href={n.id === "services" ? "/services" : pathname === "/" ? `#${n.id}` : `/#${n.id}`} onClick={(event) => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); go(n.id); }} aria-current={activeSection === n.id ? "location" : undefined} className="rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-surface-2" data-testid={`link-mobile-${n.id}`}>
                  {t(n.key)}
                </a>
              ))}
              <a href={settings.resumeUrl || site.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2">
                <Download className="h-4 w-4" /> {t("cta_resume")}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Socials({ className = "" }: { className?: string }) {
  const { data: settings } = useSiteSettings();
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {settings.github && (
        <ExternalLink href={settings.github} aria-label="GitHub" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink" data-testid="link-github">
          <GithubIcon className="h-4 w-4" />
        </ExternalLink>
      )}
      {settings.linkedin && (
        <ExternalLink href={settings.linkedin} aria-label="LinkedIn" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink" data-testid="link-linkedin">
          <LinkedinIcon className="h-4 w-4" />
        </ExternalLink>
      )}
      {settings.website && (
        <ExternalLink href={settings.website} aria-label="Website" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink" data-testid="link-website">
          <Globe2 className="h-4 w-4" />
        </ExternalLink>
      )}
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();
  const resumeLabel = t("cta_resume");
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col items-start justify-between gap-6 py-10 text-sm text-muted md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-7" />
          <div>
            <p className="font-medium text-ink">© {new Date().getFullYear()} {settings.name}</p>
            <p className="text-xs">{t("footer_built")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {site.available && <span className="inline-flex items-center gap-2 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-success" />{t("available")}</span>}
          <a href={settings.resumeUrl || site.resumeUrl} download="Tafa_Belli_Brown_Resume.pdf" className="link text-xs">{resumeLabel}</a>
          <a href={`mailto:${settings.email}`} className="link">{settings.email}</a>
          <Socials />
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname, state } = useLocation() as { pathname: string; state: { scrollTo?: string } | null };
  useEffect(() => {
    if (state?.scrollTo) {
      const id = state.scrollTo;
      requestAnimationFrame(() => setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 60));
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, state]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-bg" onClick={(e) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 outline-hidden">{children}</main>
      <Footer />
    </div>
  );
}


export const prose = "prose prose-neutral max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-accent prose-strong:text-ink prose-li:marker:text-accent prose-code:before:content-none prose-code:after:content-none prose-code:rounded-sm prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-pre:bg-[hsl(224_30%_10%)] prose-pre:border prose-pre:border-border";

const CANONICAL_ORIGIN = "https://tafabellibrown.vercel.app";
const DEFAULT_SOCIAL_IMAGE =
  "/api/assets?bucket=site-assets&path=projects%2Fdream-scholarships.jpg";

export function useTitle(
  title?: string,
  description?: string,
  options: {
    image?: string | null;
    type?: "website" | "article";
    noIndex?: boolean;
  } = {},
) {
  const { pathname } = useLocation();
  useEffect(() => {
    const pageTitle = title
      ? `${title} | ${site.name}`
      : `${site.name} | Full-Stack Web Developer`;
    const pageDescription =
      description ||
      "Full-stack web developer building fast, reliable products with React, TypeScript, Node.js and PostgreSQL.";
    const canonicalUrl = new URL(pathname, CANONICAL_ORIGIN).toString();
    const imageUrl = new URL(
      options.image || DEFAULT_SOCIAL_IMAGE,
      CANONICAL_ORIGIN,
    ).toString();
    const noIndex =
      options.noIndex ??
      (pathname === ADMIN_ROUTE || pathname.startsWith(`${ADMIN_ROUTE}/`));
    document.title = pageTitle;
    const setMeta = (selector: string, attribute: "name" | "property", key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key); document.head.appendChild(element); }
      element.content = value;
    };
    setMeta('meta[name="description"]', "name", "description", pageDescription);
    setMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    );
    setMeta('meta[property="og:title"]', "property", "og:title", pageTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", pageDescription);
    setMeta(
      'meta[property="og:type"]',
      "property",
      "og:type",
      options.type ?? "website",
    );
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
    setMeta(
      'meta[property="og:image:alt"]',
      "property",
      "og:image:alt",
      title ? `${title} — ${site.name}` : `${site.name} portfolio`,
    );
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", pageTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", pageDescription);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);
    setMeta(
      'meta[name="twitter:image:alt"]',
      "name",
      "twitter:image:alt",
      title ? `${title} — ${site.name}` : `${site.name} portfolio`,
    );
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
  }, [description, options.image, options.noIndex, options.type, pathname, title]);
}

export function Back({ to = "/", label }: { to?: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink" data-testid="link-back">
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}
