import { Link } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, X } from "lucide-react";

/**
 * Removes leftover "**" markers that cannot be paired on a line, so a model
 * reply never shows raw stars even when it formats bold badly.
 */
export function cleanMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      (line.match(/\*\*/g)?.length ?? 0) % 2 === 1 ? line.replace(/\*\*/g, "") : line,
    )
    .join("\n");
}

const HOME_SECTIONS = new Set(["about", "skills", "projects", "services", "experience", "blog", "contact"]);

function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expanded]);
  if (!src) return null;
  let target: URL;
  try {
    target = new URL(src, window.location.href);
  } catch {
    return null;
  }
  if (target.origin !== window.location.origin) return null;
  let downloadName = target.pathname.split("/").pop() || "image";
  try {
    downloadName = decodeURIComponent(downloadName);
  } catch {
    downloadName = "image";
  }
  return (
    <>
      <figure className="my-3 w-fit max-w-full overflow-hidden rounded-xl border border-border bg-surface">
        <button type="button" onClick={() => setExpanded(true)} className="block cursor-zoom-in p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={`Enlarge ${alt || "image shared by Beari"}`}>
          <img src={target.href} alt={alt || "Image shared by Beari"} loading="lazy" className="max-h-44 max-w-[240px] rounded-lg object-contain sm:max-w-[280px]" />
        </button>
        <figcaption className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
          <span className="min-w-0 truncate text-xs text-muted">{alt || "Image"}</span>
          <a href={target.href} download={downloadName} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent/40 hover:text-accent">
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </figcaption>
      </figure>
      {expanded && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={alt || "Expanded image"} onClick={() => setExpanded(false)}>
          <button type="button" onClick={() => setExpanded(false)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close expanded image">
            <X className="h-5 w-5" />
          </button>
          <img src={target.href} alt={alt || "Image shared by Beari"} className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  );
}

/** Route portfolio links through React Router so they also work in hash-router builds. */
function MarkdownLink({ href, children }: { href?: string; children?: ReactNode }) {
  if (!href) return <>{children}</>;

  let target: URL;
  try {
    target = new URL(href, window.location.href);
  } catch {
    return <>{children}</>;
  }

  const internal = href.startsWith("/") || target.origin === window.location.origin;
  if (internal) {
    const sectionFromPath = target.pathname.match(/^\/(about|skills|projects|services|experience|blog|contact)\/?$/)?.[1];
    const sectionFromHash = target.pathname === "/" ? target.hash.slice(1) : "";
    const section = sectionFromPath || (HOME_SECTIONS.has(sectionFromHash) ? sectionFromHash : "");
    if (section) return <Link to="/" state={{ scrollTo: section }}>{children}</Link>;

    return <Link to={`${target.pathname}${target.search}${target.hash}`}>{children}</Link>;
  }

  if (target.protocol === "http:" || target.protocol === "https:") {
    return <a href={target.href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }
  if (target.protocol === "mailto:" || target.protocol === "tel:") {
    return <a href={target.href}>{children}</a>;
  }
  return <>{children}</>;
}

const components: Components = { a: MarkdownLink };

const STYLE =
  "text-sm leading-relaxed break-words " +
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_p]:mb-2.5 [&_ul]:mb-2.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-2.5 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-1 [&_strong]:font-bold [&_em]:italic " +
  "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 " +
  "[&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-ink [&_code]:text-[0.9em] " +
  "[&_pre]:mb-2.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted";

/** Renders an assistant reply as formatted text (bold, lists, links), never raw markdown. */
export function BeariMarkdown({ children, className = "", allowImages = false }: { children: string; className?: string; allowImages?: boolean }) {
  return (
    <div className={`${STYLE} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={allowImages ? { ...components, img: MarkdownImage } : components}
        disallowedElements={allowImages ? ["h1", "h2", "h3", "h4", "h5", "h6"] : ["img", "h1", "h2", "h3", "h4", "h5", "h6"]}
        unwrapDisallowed
      >
        {cleanMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
