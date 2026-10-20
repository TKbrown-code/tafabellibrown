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
    <article className="container max-w-3xl py-14">
      <Back to="/blog" label={t("all_posts")} />
      <header className="mt-10">
        <p className="font-mono text-xs text-faint">{formatDate(p.published_at, lang)} · {p.reading_minutes} {t("min_read")}</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] md:text-5xl" data-testid="text-post-title">{loc(p.title, p.title_zh, p.title_fr, p.title_es, p.title_ar, p.title_pcm)}</h1>
        <p className="mt-5 text-lg text-muted">{loc(p.excerpt, p.excerpt_zh, p.excerpt_fr, p.excerpt_es, p.excerpt_ar, p.excerpt_pcm)}</p>
        <div className="mt-6 flex flex-wrap gap-1.5">{p.tags.map((tg) => <span key={tg} className="chip">{tg}</span>)}</div>
      </header>
      {p.cover_url && <img src={assetUrl(p.cover_url)} alt={`${p.title} thumbnail`} className="mt-10 aspect-[16/9] w-full rounded-2xl border border-border object-cover" />}
      <div className={`${prose} article-prose mt-12 border-t border-border pt-10`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{loc(p.content, p.content_zh, p.content_fr, p.content_es, p.content_ar, p.content_pcm)}</ReactMarkdown>
      </div>
    </article>
  );
}
