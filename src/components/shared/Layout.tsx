import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Download, Menu, Moon, Sun, X } from "lucide-react";
import { useI18n, type DictKey } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { site } from "@/data/site";
import { ExternalLink, GithubIcon, LinkedinIcon, Logo, useScrollTo } from "./ui";

const NAV: { id: string; key: DictKey }[] = [
  { id: "about", key: "nav_about" },
  { id: "skills", key: "nav_skills" },
  { id: "projects", key: "nav_projects" },
  { id: "experience", key: "nav_experience" },
  { id: "blog", key: "nav_blog" },
  { id: "contact", key: "nav_contact" },
];

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-medium" role="group" aria-label="Language">
      {(["en", "zh"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          data-testid={`button-lang-${l}`}
          aria-pressed={lang === l}
          className={`whitespace-nowrap rounded-full px-2.5 py-1 transition-colors ${lang === l ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
        >
          {l === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button onClick={toggle} aria-label={t("theme")} data-testid="button-theme" className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink">
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Header() {
  const { t } = useI18n();
  const scrollTo = useScrollTo();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const go = (id: string) => {
    const wasOpen = open;
    setOpen(false);
    if (id === "blog" && pathname.startsWith("/blog")) return;
    // wait for the mobile menu to collapse so the smooth scroll isn't interrupted
    if (wasOpen) setTimeout(() => scrollTo(id), 280);
    else scrollTo(id);
  };

  return (
    <header className={`sticky top-0 z-40 transition-[background,border-color,backdrop-filter] duration-300 ${scrolled || open ? "border-b border-border bg-bg/85 backdrop-blur-md" : "border-b border-transparent"}`}>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5" data-testid="link-home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Logo />
          <span className="hidden whitespace-nowrap font-display text-[1.05rem] font-bold tracking-tight sm:inline">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} data-testid={`link-nav-${n.id}`} className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink">
              {t(n.key)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          <a href={site.resumeUrl} download="Tafa_Belli_Brown_Resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm hidden sm:inline-flex" data-testid="button-resume-header">
            <Download className="h-3.5 w-3.5" /> CV
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
                <button key={n.id} onClick={() => go(n.id)} className="rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-surface-2" data-testid={`link-mobile-${n.id}`}>
                  {t(n.key)}
                </button>
              ))}
              <a href={site.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2">
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
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {site.github && (
        <ExternalLink href={site.github} aria-label="GitHub" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink" data-testid="link-github">
          <GithubIcon className="h-4 w-4" />
        </ExternalLink>
      )}
      {site.linkedin && (
        <ExternalLink href={site.linkedin} aria-label="LinkedIn" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink" data-testid="link-linkedin">
          <LinkedinIcon className="h-4 w-4" />
        </ExternalLink>
      )}
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col items-start justify-between gap-6 py-10 text-sm text-muted md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-7" />
          <div>
            <p className="font-medium text-ink">© {new Date().getFullYear()} {site.name}</p>
            <p className="text-xs">{t("footer_built")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a href={`mailto:${site.email}`} className="link">{site.email}</a>
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


export const prose = "prose prose-neutral max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-accent prose-strong:text-ink prose-li:marker:text-accent prose-code:before:content-none prose-code:after:content-none prose-code:rounded-sm prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-pre:bg-[hsl(224_30%_10%)] prose-pre:border prose-pre:border-border [&_pre_code]:bg-transparent [&_pre_code]:p-0";

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${site.name}` : `${site.name} — Full-Stack Web Developer`;
  }, [title]);
}

export function Back({ to = "/", label }: { to?: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink" data-testid="link-back">
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}