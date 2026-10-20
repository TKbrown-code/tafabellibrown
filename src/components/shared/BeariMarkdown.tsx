import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

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
export function BeariMarkdown({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`${STYLE} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        disallowedElements={["img", "h1", "h2", "h3", "h4", "h5", "h6"]}
        unwrapDisallowed
      >
        {cleanMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
