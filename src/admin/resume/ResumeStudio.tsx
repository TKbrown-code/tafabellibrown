import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronRight, Eye, Save } from "lucide-react";
import { ResumeEditor } from "./ResumeEditor";
import { ResumeAssistant, type Suggestion } from "./ResumeAssistant";

interface Props {
  value: string;
  onChange: (markdown: string) => void;
  onSave: () => void;
  onPreview: (html: string) => void;
  saving?: boolean;
  /** Ask your backend for suggestions about the draft. */
  review: (draft: string) => Promise<Suggestion[]>;
  /** Ask your backend a free-form question about the draft. */
  ask: (question: string, draft: string) => Promise<string>;
}

/** Résumé editor (formatted, no markdown signs) with a suggestions panel that has its own input box. */
export function ResumeStudio({ value, onChange, onSave, onPreview, saving, review, ask }: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [assistantWidth, setAssistantWidth] = useState(320);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  const resizeAssistant = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = layoutRef.current?.getBoundingClientRect();
    if (bounds) setAssistantWidth(Math.max(280, Math.min(560, bounds.right - event.clientX)));
  };

  const onReview = useCallback(async () => {
    setReviewing(true);
    try { setSuggestions(await review(value)); } finally { setReviewing(false); }
  }, [review, value]);

  return (
    <div
      ref={layoutRef}
      className={`grid min-w-0 items-start gap-3 ${assistantOpen ? "lg:grid-cols-[minmax(0,1fr)_10px_minmax(280px,var(--resume-assistant-width))]" : "lg:grid-cols-[minmax(0,1fr)_auto]"}`}
      style={{ "--resume-assistant-width": `${assistantWidth}px` } as CSSProperties}
    >
      <ResumeEditor
        value={value}
        onChange={onChange}
        onReady={setEditor}
        actions={
          <div className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => onPreview(editor?.getHTML() ?? "")}><Eye className="h-3.5 w-3.5" /> Preview résumé</button>
            <button type="button" className="btn-primary btn-sm" onClick={onSave} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save draft"}</button>
          </div>
        }
      />
      {assistantOpen && <div
        role="separator"
        aria-label="Resize Beari sidebar"
        aria-orientation="vertical"
        aria-valuemin={280}
        aria-valuemax={560}
        aria-valuenow={assistantWidth}
        tabIndex={0}
        className={`group hidden cursor-col-resize touch-none items-center justify-center rounded-full outline-none transition-colors hover:bg-accent/20 focus-visible:bg-accent/20 lg:flex ${dragging ? "bg-accent/25" : ""}`}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); resizeAssistant(event); }}
        onPointerMove={(event) => { if (dragging) resizeAssistant(event); }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); setAssistantWidth((width) => Math.max(280, width - 24)); }
          if (event.key === "ArrowRight") { event.preventDefault(); setAssistantWidth((width) => Math.min(560, width + 24)); }
        }}
      ><span className="h-10 w-1 rounded-full bg-border transition-colors group-hover:bg-accent group-focus-visible:bg-accent" /></div>}
      {assistantOpen ? <div className="min-h-[420px] min-w-0 lg:h-[calc(100dvh-11rem)] lg:min-h-[560px]">
        <ResumeAssistant
          draft={value}
          suggestions={suggestions}
          reviewing={reviewing}
          onReview={() => void onReview()}
          onAsk={ask}
          onApply={(md) => editor?.chain().focus().insertContent(md).run()}
          onDismiss={(id) => setSuggestions((s) => s.filter((x) => x.id !== id))}
          onCollapse={() => setAssistantOpen(false)}
        />
      </div> : <div className="flex justify-end lg:pt-1">
        <button type="button" className="btn-ghost btn-sm" onClick={() => setAssistantOpen(true)} aria-label="Show Beari sidebar"><ChevronRight className="h-4 w-4" /> Show Beari</button>
      </div>}
    </div>
  );
}
