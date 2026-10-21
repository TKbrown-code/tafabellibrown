import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { usePosts } from "@/lib/api";
import { Skeleton, formatDate, assetUrl } from "@/components/shared/ui";
import { useTitle, Back } from "@/components/shared/Layout";

export function BlogIndex() {
  const { t, loc, lang } = useI18n();
  const { data, isLoading } = usePosts();
  useTitle(
    t("blog_title"),
    "Practical notes from Tafa Belli Brown on full-stack development, PostgreSQL, Redis, web performance, SSR and shipping production products.",
  );
  return (
    <div className="container min-w-0 max-w-3xl py-8 sm:py-14">
      <Back label={t("back_home")} />
      <p className="kicker mt-10">{t("blog_kicker")}</p>
      <h1 className="mt-3 break-words text-3xl font-extrabold sm:text-4xl md:text-5xl">{t("blog_title")}</h1>
      <div className="mt-12 divide-y divide-border border-y border-border">
        {isLoading && <Skeleton className="my-6 h-24" />}
        {data?.length === 0 && <p className="py-10 text-muted">No posts yet.</p>}
        {data?.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="group grid min-w-0 gap-4 py-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-5 sm:py-7" data-testid={`link-post-${p.slug}`}>
            {p.cover_url ? <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-[#111827]">
              <img src={assetUrl(p.cover_url)} alt={`${p.title} thumbnail`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,.12),transparent_48%,rgba(59,130,246,.24))] mix-blend-multiply" />
            </div> : <div className="aspect-[16/10] rounded-xl bg-surface-2" />}
            <div className="min-w-0">
            <p className="font-mono text-xs text-faint">{formatDate(p.published_at, lang)} · {p.reading_minutes} {t("min_read")}</p>
            <h2 className="mt-2 break-words text-xl font-bold transition-colors group-hover:text-accent sm:text-2xl">{loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)}</h2>
            <p className="mt-2 break-words text-sm text-muted sm:text-base">{loc(p.excerpt, p.excerpt_zh, p.excerpt_fr, p.excerpt_es, p.excerpt_ar, p.excerpt_pcm)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
