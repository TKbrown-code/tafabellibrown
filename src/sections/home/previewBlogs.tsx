import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { usePosts } from "@/lib/api";
import { Reveal, Skeleton, formatDate } from "@/components/shared/ui";

export function BlogPreview() {
  const { t, loc, lang } = useI18n();
  const { data, isLoading } = usePosts();
  return (
    <section id="blog" className="section border-t border-border">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="kicker">{t("blog_kicker")}</p>
            <h2 className="h-section">{t("blog_title")}</h2>
          </Reveal>
          <Link to="/blog" className="btn-ghost" data-testid="link-all-posts">
            {t("all_posts")} <ArrowRight className="h-4 w-4 rtl-mirror" />
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
                <h3 className="mt-3 text-xl font-bold leading-snug transition-colors group-hover:text-accent">{loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)}</h3>
                <p className="mt-3 text-sm text-muted">{loc(p.excerpt, p.excerpt_zh, p.excerpt_fr, p.excerpt_es, p.excerpt_ar, p.excerpt_pcm)}</p>
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
