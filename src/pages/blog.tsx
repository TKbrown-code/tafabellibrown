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
    <div className="container max-w-3xl py-14">
      <Back label={t("back_home")} />
      <p className="kicker mt-10">{t("blog_kicker")}</p>
      <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{t("blog_title")}</h1>
      <div className="mt-12 divide-y divide-border border-y border-border">
        {isLoading && <Skeleton className="my-6 h-24" />}
        {data?.length === 0 && <p className="py-10 text-muted">No posts yet.</p>}
        {data?.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="group grid gap-5 py-7 sm:grid-cols-[180px_1fr]" data-testid={`link-post-${p.slug}`}>
            {p.cover_url ? <img src={assetUrl(p.cover_url)} alt={`${p.title} thumbnail`} loading="lazy" className="aspect-[16/10] w-full rounded-xl border border-border object-cover" /> : <div className="aspect-[16/10] rounded-xl bg-surface-2" />}
            <div>
            <p className="font-mono text-xs text-faint">{formatDate(p.published_at, lang)} · {p.reading_minutes} {t("min_read")}</p>
            <h2 className="mt-2 text-2xl font-bold transition-colors group-hover:text-accent">{loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)}</h2>
            <p className="mt-2 text-muted">{loc(p.excerpt, p.excerpt_zh, p.excerpt_fr, p.excerpt_es, p.excerpt_ar, p.excerpt_pcm)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
