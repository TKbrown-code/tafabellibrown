import { useEffect, type ReactNode } from "react";
import { Extension, Mark, nodeInputRule } from "@tiptap/core";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { DOMSerializer } from "@tiptap/pm/model";
import { defaultMarkdownSerializer } from "@tiptap/pm/markdown";
import StarterKit from "@tiptap/starter-kit";
import { Heading } from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import { Paragraph } from "@tiptap/extension-paragraph";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, Heading1, Heading2, Heading3, Italic, Link2, List, ListOrdered, Palette, Quote, Redo2, Undo2,
} from "lucide-react";
import "./resume-editor.css";

type MdStorage = { markdown: { getMarkdown: () => string } };
export const getMarkdown = (editor: Editor): string => (editor.storage as unknown as MdStorage).markdown.getMarkdown();

const MarkdownHeadingInput = Extension.create({
  name: "markdownHeadingInput",
  addInputRules() {
    return [1, 2, 3].map((level) => nodeInputRule({
      find: new RegExp(`^#{${level}}\\s$`),
      type: this.editor.schema.nodes.heading,
      getAttributes: () => ({ level }),
    }));
  },
});

const resumeBlockAttributes = {
  resumeAlign: {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-resume-align") || element.style.textAlign || null,
    renderHTML: (attributes: Record<string, unknown>) => {
      const align = attributes.resumeAlign;
      return typeof align === "string" && ["left", "center", "right", "justify"].includes(align)
        ? { "data-resume-align": align, style: `text-align: ${align}` }
        : {};
    },
  },
  resumeSpacing: {
    default: null,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-resume-spacing") || null,
    renderHTML: (attributes: Record<string, unknown>) => {
      const spacing = attributes.resumeSpacing;
      if (spacing === "tight") return { "data-resume-spacing": spacing, style: "margin-bottom: 0.2em" };
      if (spacing === "relaxed") return { "data-resume-spacing": spacing, style: "margin-bottom: 1.25em" };
      return {};
    },
  },
};

function serializeStyledBlock(state: Parameters<typeof defaultMarkdownSerializer.nodes.paragraph>[0], node: Parameters<typeof defaultMarkdownSerializer.nodes.paragraph>[1], parent: Parameters<typeof defaultMarkdownSerializer.nodes.paragraph>[2], index: number, fallback: typeof defaultMarkdownSerializer.nodes.paragraph) {
  if (!node.attrs.resumeAlign && !node.attrs.resumeSpacing) {
    fallback(state, node, parent, index);
    return;
  }
  const rendered = DOMSerializer.fromSchema(node.type.schema).serializeNode(node);
  state.write(rendered.nodeType === 1 ? (rendered as HTMLElement).outerHTML : rendered.textContent ?? "");
  state.closeBlock(node);
}

const ResumeParagraph = Paragraph.extend({
  addAttributes() { return { ...this.parent?.(), ...resumeBlockAttributes }; },
  addStorage() {
    return { markdown: { serialize: (state: Parameters<typeof defaultMarkdownSerializer.nodes.paragraph>[0], node: Parameters<typeof defaultMarkdownSerializer.nodes.paragraph>[1], parent: Parameters<typeof defaultMarkdownSerializer.nodes.paragraph>[2], index: number) => serializeStyledBlock(state, node, parent, index, defaultMarkdownSerializer.nodes.paragraph), parse: {} } };
  },
});

const ResumeHeading = Heading.extend({
  addAttributes() { return { ...this.parent?.(), ...resumeBlockAttributes }; },
  addStorage() {
    return { markdown: { serialize: (state: Parameters<typeof defaultMarkdownSerializer.nodes.heading>[0], node: Parameters<typeof defaultMarkdownSerializer.nodes.heading>[1], parent: Parameters<typeof defaultMarkdownSerializer.nodes.heading>[2], index: number) => serializeStyledBlock(state, node, parent, index, defaultMarkdownSerializer.nodes.heading), parse: {} } };
  },
});

const ResumeTextColor = Mark.create({
  name: "resumeTextColor",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.color || element.getAttribute("data-resume-color"),
        renderHTML: (attributes: Record<string, unknown>) => typeof attributes.color === "string" ? { style: `color: ${attributes.color}` } : {},
      },
    };
  },
  parseHTML() { return [{ tag: "span[style*=color]" }, { tag: "span[data-resume-color]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", HTMLAttributes, 0]; },
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: (mark: { attrs: Record<string, unknown> }) => `<span style="color: ${String(mark.attrs.color || "#2563eb")}">`,
          close: "</span>",
        },
        parse: {},
      },
    };
  },
});

interface Props {
  /** Markdown string. The editor shows it formatted and writes markdown back, so saved data stays compatible. */
  value: string;
  onChange: (markdown: string) => void;
  /** Gives the parent the editor, for example to insert an assistant suggestion at the cursor. */
  onReady?: (editor: Editor) => void;
  actions?: ReactNode;
  placeholder?: string;
}

function Btn({ label, active, disabled, onClick, children }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // mouse down would steal focus from the editor and lose the selection
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors disabled:opacity-40 ${
        active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function ResumeEditor({ value, onChange, onReady, actions, placeholder = "Start with your summary…" }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, paragraph: false }),
      ResumeParagraph,
      ResumeHeading.configure({ levels: [1, 2, 3] }),
      ResumeTextColor,
      MarkdownHeadingInput,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: true, tightLists: true, bulletListMarker: "-", linkify: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "resume-prosemirror max-w-none text-ink",
        "aria-label": "Résumé editor",
      },
    },
    onUpdate: ({ editor }) => onChange(getMarkdown(editor)),
  });

  useEffect(() => { if (editor && onReady) onReady(editor); }, [editor, onReady]);

  // Load new content from outside (for example after fetching saved data), without fighting the user's typing.
  useEffect(() => {
    if (editor && value !== getMarkdown(editor)) editor.commands.setContent(value, false);
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address (leave empty to remove)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const c = () => editor.chain().focus();
  const activeBlock = () => editor.isActive("heading") ? "heading" : "paragraph";
  const setAlignment = (resumeAlign: "left" | "center" | "right" | "justify") => c().updateAttributes(activeBlock(), { resumeAlign }).run();
  const setSpacing = (resumeSpacing: "tight" | "relaxed" | null) => c().updateAttributes(activeBlock(), { resumeSpacing }).run();
  return (
    <div className="card resume-editor flex min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Formatting">
          <Btn label="Bold" active={editor.isActive("bold")} onClick={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
          <Btn label="Italic" active={editor.isActive("italic")} onClick={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Btn label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => c().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Btn>
          <Btn label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
          <Btn label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Btn label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
          <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
          <Btn label="Quote" active={editor.isActive("blockquote")} onClick={() => c().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
          <Btn label="Code" active={editor.isActive("code")} onClick={() => c().toggleCode().run()}><Code className="h-4 w-4" /></Btn>
          <Btn label="Link" active={editor.isActive("link")} onClick={setLink}><Link2 className="h-4 w-4" /></Btn>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Btn label="Align left" active={editor.isActive("paragraph", { resumeAlign: "left" }) || editor.isActive("heading", { resumeAlign: "left" })} onClick={() => setAlignment("left")}><AlignLeft className="h-4 w-4" /></Btn>
          <Btn label="Center text" active={editor.isActive("paragraph", { resumeAlign: "center" }) || editor.isActive("heading", { resumeAlign: "center" })} onClick={() => setAlignment("center")}><AlignCenter className="h-4 w-4" /></Btn>
          <Btn label="Align right" active={editor.isActive("paragraph", { resumeAlign: "right" }) || editor.isActive("heading", { resumeAlign: "right" })} onClick={() => setAlignment("right")}><AlignRight className="h-4 w-4" /></Btn>
          <Btn label="Justify text" active={editor.isActive("paragraph", { resumeAlign: "justify" }) || editor.isActive("heading", { resumeAlign: "justify" })} onClick={() => setAlignment("justify")}><AlignJustify className="h-4 w-4" /></Btn>
          <label className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink" title="Text color">
            <Palette className="pointer-events-none h-4 w-4" />
            <input type="color" aria-label="Text color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" defaultValue="#2563eb" onChange={(event) => c().setMark("resumeTextColor", { color: event.target.value }).run()} />
          </label>
          <label className="ml-1 flex items-center gap-1.5 text-xs text-muted">
            <span className="sr-only">Paragraph spacing</span>
            <select aria-label="Paragraph spacing" className="h-8 rounded-lg border border-border bg-bg px-2 text-xs text-ink" value={String(editor.getAttributes(activeBlock()).resumeSpacing ?? "normal")} onChange={(event) => setSpacing(event.target.value === "normal" ? null : event.target.value as "tight" | "relaxed")}>
              <option value="tight">Tight spacing</option>
              <option value="normal">Normal spacing</option>
              <option value="relaxed">Relaxed spacing</option>
            </select>
          </label>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Btn label="Undo" disabled={!editor.can().undo()} onClick={() => c().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
          <Btn label="Redo" disabled={!editor.can().redo()} onClick={() => c().redo().run()}><Redo2 className="h-4 w-4" /></Btn>
        </div>
        {actions}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
