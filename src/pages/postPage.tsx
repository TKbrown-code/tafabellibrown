import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "@/lib/i18n";
import { usePosts } from "@/lib/api";
import { Skeleton, formatDate, assetUrl } from "@/components/shared/ui";
import { useTitle, Back, prose } from "@/components/shared/Layout";
import { NotFound } from "./404"

export function PostPage() {
  const { slug } = useParams();
  const { t, loc, lang } = useI18n();
  const { data, isLoading } = usePosts();
  const p = data?.find((x) => x.slug === slug);
  useTitle(
    p
      ? loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)
      : undefined,
    p
      ? loc(p.excerpt, p.excerpt_zh, p.excerpt_fr, p.excerpt_es, p.excerpt_ar, p.excerpt_pcm)
      : undefined,
    { image: p?.cover_url, type: "article" },
  );
  if (isLoading) return <div className="container max-w-3xl py-20"><Skeleton className="h-96" /></div>;
  if (!p) return <NotFound />;
  return (
    <article className="container min-w-0 max-w-3xl py-8 sm:py-14">
      <Back to="/blog" label={t("all_posts")} />
      <header className="mt-10">
        <p className="font-mono text-xs text-faint">{formatDate(p.published_at, lang)} · {p.reading_minutes} {t("min_read")}</p>
        <h1 className="mt-3 break-words text-3xl font-extrabold leading-[1.08] sm:text-4xl md:text-5xl" data-testid="text-post-title">{loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)}</h1>
        <p className="mt-5 break-words text-base text-muted sm:text-lg">{loc(p.excerpt, p.excerpt_zh, p.excerpt_fr, p.excerpt_es, p.excerpt_ar, p.excerpt_pcm)}</p>
        <div className="mt-6 flex flex-wrap gap-1.5">{p.tags.map((tg) => <span key={tg} className="chip">{tg}</span>)}</div>
      </header>
      {p.cover_url && <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-[#111827]">
        <img src={assetUrl(p.cover_url)} alt={`${p.title} thumbnail`} className="h-full w-full object-cover" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,.12),transparent_48%,rgba(59,130,246,.24))] mix-blend-multiply" />
      </div>}
      <div className={`${prose} article-prose mt-8 min-w-0 border-t border-border pt-7 sm:mt-12 sm:pt-10`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{loc(p.content, p.content_zh, p.content_fr, p.content_es, p.content_ar, p.content_pcm)}</ReactMarkdown>
      </div>
    </article>
  );
}
