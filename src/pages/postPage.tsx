import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useI18n } from "@/lib/i18n";
import { usePosts } from "@/lib/api";
import { Skeleton, formatDate } from "@/components/ui";
import { useTitle, Back, prose } from "@/components/Layout";
import { NotFound } from "./404"

export function PostPage() {
  const { slug } = useParams();
  const { t, loc, lang } = useI18n();
  const { data, isLoading } = usePosts();
  const p = data?.find((x) => x.slug === slug);
  useTitle(p?.title);
  if (isLoading) return <div className="container max-w-3xl py-20"><Skeleton className="h-96" /></div>;
  if (!p) return <NotFound />;
  return (
    <article className="container max-w-3xl py-14">
      <Back to="/blog" label={t("all_posts")} />
      <header className="mt-10">
        <p className="font-mono text-xs text-faint">{formatDate(p.published_at, lang)} · {p.reading_minutes} {t("min_read")}</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] md:text-5xl" data-testid="text-post-title">{loc(p.title, p.title_zh)}</h1>
        <p className="mt-5 text-lg text-muted">{loc(p.excerpt, p.excerpt_zh)}</p>
        <div className="mt-6 flex flex-wrap gap-1.5">{p.tags.map((tg) => <span key={tg} className="chip">{tg}</span>)}</div>
      </header>
      <div className={`${prose} mt-12 border-t border-border pt-10`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{loc(p.content, p.content_zh)}</ReactMarkdown>
      </div>
    </article>
  );
}

