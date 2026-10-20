import { useState, type FormEvent } from "react";
import { Check, ChevronRight, Send, Sparkles, X } from "lucide-react";
import { BeariMarkdown } from "@/components/shared/BeariMarkdown";

export interface Suggestion {
  id: string;
  /** Short explanation shown to the user. */
  text: string;
  /** Optional ready-to-insert markdown. When present an Apply button appears. */
  insert?: string;
}

interface Turn { id: string; role: "user" | "assistant"; content: string }

interface Props {
  draft: string;
  suggestions: Suggestion[];
  reviewing: boolean;
  onReview: () => void;
  /** Free-form question. Receives the current draft so Beari can answer about it. */
  onAsk: (question: string, draft: string) => Promise<string>;
  onApply: (markdown: string) => void;
  onDismiss: (id: string) => void;
  onCollapse: () => void;
}

const QUICK = ["Tighten my summary", "Add metrics to my bullets", "Check ATS keywords", "Will this fit one page?"];

export function ResumeAssistant({ draft, suggestions, reviewing, onReview, onAsk, onApply, onDismiss, onCollapse }: Props) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const id = () => Math.random().toString(36).slice(2);
    setTurns((t) => [...t, { id: id(), role: "user", content: question }]);
    setText("");
    setBusy(true);
    try {
      const answer = await onAsk(question, draft);
      setTurns((t) => [...t, { id: id(), role: "assistant", content: answer }]);
    } catch {
      setTurns((t) => [...t, { id: id(), role: "assistant", content: "Sorry, I couldn't answer that just now. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => { e.preventDefault(); void ask(text); };

  return (
    <aside className="card flex h-full min-h-[420px] flex-col overflow-hidden" aria-label="Beari suggestions">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="flex min-w-0 items-center gap-2 font-display text-sm font-bold"><Sparkles className="h-4 w-4 shrink-0 text-accent" /><span className="truncate">Beari suggestions</span></p>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className="btn-ghost btn-sm whitespace-nowrap px-2" onClick={onReview} disabled={reviewing}>
            {reviewing ? "Reviewing…" : "Review draft"}
          </button>
          <button type="button" className="btn-ghost grid h-8 w-8 place-items-center rounded-lg" onClick={onCollapse} aria-label="Hide Beari sidebar" title="Hide Beari sidebar">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
        <details className="rounded-xl border border-border bg-surface p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted">Live résumé context · {draft.trim().split(/\s+/).filter(Boolean).length} words</summary>
          <div className="mt-3 max-h-64 overflow-y-auto border-t border-border pt-3">
            {draft.trim() ? <BeariMarkdown>{draft}</BeariMarkdown> : <p className="text-sm text-muted">Your résumé draft will appear here as you edit.</p>}
          </div>
        </details>
        {suggestions.length === 0 && turns.length === 0 && (
          <p className="text-sm text-muted">Press “Review draft” for suggestions, or ask a question below.</p>
        )}

        {suggestions.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-surface-2/50 p-3">
            <BeariMarkdown>{s.text}</BeariMarkdown>
            <div className="mt-2 flex gap-2">
              {s.insert && (
                <button type="button" className="btn-primary btn-sm" onClick={() => onApply(s.insert!)}>
                  <Check className="h-3.5 w-3.5" /> Apply
                </button>
              )}
              <button type="button" className="btn-ghost btn-sm" onClick={() => onDismiss(s.id)}>
                <X className="h-3.5 w-3.5" /> Dismiss
              </button>
            </div>
          </div>
        ))}

        {turns.map((t) =>
          t.role === "user" ? (
            <p key={t.id} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm text-accent-ink">{t.content}</p>
          ) : (
            <div key={t.id} className="max-w-[92%] rounded-2xl rounded-bl-md border border-border bg-surface-2/50 px-3.5 py-2.5">
              <BeariMarkdown>{t.content}</BeariMarkdown>
            </div>
          ),
        )}
        {busy && <p className="text-sm text-muted" role="status">Beari is thinking…</p>}
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q} type="button" className="chip hover:border-accent hover:text-accent" disabled={busy} onClick={() => void ask(q)}>{q}</button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Beari about your résumé…"
            aria-label="Ask Beari about your résumé"
            maxLength={2000}
            className="input flex-1"
          />
          <button type="submit" className="btn-primary h-10 w-10 shrink-0 p-0" disabled={!text.trim() || busy} aria-label="Send question">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
