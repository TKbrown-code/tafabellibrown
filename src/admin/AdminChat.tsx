import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpRight, Copy, ImagePlus, RotateCcw, Send, Sparkles, Volume2, X } from "lucide-react";
import { BeariMarkdown } from "@/components/shared/BeariMarkdown";

export interface AdminChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  retryable?: boolean;
}

function visibleMessageContent(content: string) {
  return content.replace(/\n?\[Image attached and stored in private chat storage\.\]/g, "").trim();
}

interface Props {
  messages: AdminChatMessage[];
  sending: boolean;
  onSend: (text: string, image?: File) => void;
  onRetry?: (messageId: string) => void;
  title?: string;
  subtitle?: string;
  maxLength?: number;
  headerIcon?: React.ReactNode;
  messageAvatar?: React.ReactNode;
  composerActions?: React.ReactNode;
  voiceTranscript?: { id: string; text: string };
  onSpeak?: (content: string) => void;
  welcomeIcon?: React.ReactNode;
  welcomeTitle?: string;
  welcomeMessage?: string;
  suggestions?: string[];
  onSuggestion?: (text: string) => void;
}

/**
 * Large, in-flow chat panel.
 * - Sized to the viewport, so the chat is big on every screen.
 * - Only the message list scrolls. The page never jumps (no scrollIntoView).
 * - The composer sits at the bottom of the card, in normal flow (not position: fixed).
 */
export function AdminChat({
  messages,
  sending,
  onSend,
  title = "Beari",
  subtitle = "Private admin assistant",
  maxLength = 10000,
  headerIcon,
  messageAvatar,
  composerActions,
  voiceTranscript,
  onSpeak,
  welcomeIcon,
  welcomeTitle,
  welcomeMessage,
  suggestions = [],
  onSuggestion,
  onRetry,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const seen = useRef(messages.length);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const [draggingImage, setDraggingImage] = useState(false);
  const [openImage, setOpenImage] = useState<string | null>(null);
  const imagePreview = useMemo(() => image ? URL.createObjectURL(image) : null, [image]);
  const latestMessage = messages[messages.length - 1];

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!openImage) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpenImage(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [openImage]);

  // Scroll only the list, never the page.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const added = messages.length > seen.current;
    seen.current = messages.length;
    const last = messages[messages.length - 1];
    if (added && last?.role === "assistant") {
      // Show the start of a new reply instead of jumping past it.
      const node = el.querySelector<HTMLElement>(`[data-msg-id="${CSS.escape(last.id)}"]`);
      if (node) el.scrollTop = Math.max(0, node.offsetTop - 12);
    } else if (added || nearBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, sending]);

  // Auto-grow the textarea up to a limit.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  useEffect(() => {
    if (!voiceTranscript?.text) return;
    setText((current) => [current.trim(), voiceTranscript.text.trim()].filter(Boolean).join(" "));
    taRef.current?.focus({ preventScroll: true });
  }, [voiceTranscript?.id]);

  const send = () => {
    const value = text.trim();
    if ((!value && !image) || sending) return;
    onSend(value, image ?? undefined);
    setText("");
    setImage(null);
    setImageError("");
    taRef.current?.focus({ preventScroll: true });
  };

  const selectImage = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) {
      setImageError("Choose a JPG, PNG, or WebP image up to 4 MB.");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    setImage(file);
    setImageError("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const copyReply = async (message: AdminChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      setCopyError("");
      window.setTimeout(() => setCopiedId((id) => id === message.id ? null : id), 1600);
    } catch {
      setCopyError("Could not copy the reply. Check clipboard permissions and try again.");
    }
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); send(); };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
  };

  return (
    <section
      className="card relative flex min-h-0 flex-1 flex-col overflow-hidden"
      aria-label={`Chat with ${title}`}
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.items).some((item) => item.kind === "file")) {
          event.preventDefault();
          setDraggingImage(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDraggingImage(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDraggingImage(false);
        if (!sending) selectImage(event.dataTransfer.files[0]);
      }}
    >
      {draggingImage && <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-bg/80 text-sm font-medium text-accent">Drop a JPG, PNG, or WebP image</div>}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {headerIcon}
          <div className="min-w-0">
            <p className="font-display text-base font-bold leading-tight">{title}</p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
        </div>
      </header>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        onScroll={(e) => {
          const el = e.currentTarget;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
        className="admin-chat-scroll relative min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5"
      >
        {messages.length === 0 && !sending && welcomeMessage && (
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-5 py-8 text-center">
            {welcomeIcon && <div className="mb-1 drop-shadow-[0_12px_28px_rgba(59,104,220,0.2)]">{welcomeIcon}</div>}
            <div className="max-w-xl"><h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{welcomeTitle || "Welcome back"}</h2><p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{welcomeMessage}</p></div>
            {!!suggestions.length && <div className="w-full max-w-2xl pt-2"><div className="mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-muted"><Sparkles className="h-3.5 w-3.5 text-accent" />A few ways I can help</div><div className="flex flex-wrap justify-center gap-2.5">{suggestions.map((suggestion) => <button key={suggestion} type="button" disabled={sending} onClick={() => onSuggestion?.(suggestion)} className="group inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 py-2.5 text-left text-xs text-ink transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent sm:text-sm"><span>{suggestion}</span><ArrowUpRight className="h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" /></button>)}</div></div>}
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} data-msg-id={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {m.role === "user" ? (
              <div className="flex max-w-[80%] flex-col items-end gap-2">
                {m.imagePreview && <button type="button" onClick={() => setOpenImage(m.imagePreview ?? null)} className="block max-w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Open attached image">
                  <img src={m.imagePreview} alt="Image attached to message" className="max-h-40 max-w-[240px] rounded-lg object-contain" />
                </button>}
                {visibleMessageContent(m.content) && <p className="max-w-full whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-sm text-accent-ink">{visibleMessageContent(m.content)}</p>}
              </div>
            ) : (
              <div className="flex max-w-[94%] items-end gap-2">
                {messageAvatar}
                <div className="min-w-0">
                  <div className="rounded-2xl rounded-bl-md border border-border bg-surface-2/50 px-4 py-3">
                    <BeariMarkdown>{m.content}</BeariMarkdown>
                  </div>
                  {latestMessage?.id === m.id && <div className="mt-1 flex items-center gap-1">
                    {m.retryable && onRetry ? (
                      <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => onRetry(m.id)} aria-label="Retry sending your message" title="Retry"><RotateCcw className="h-4 w-4" /></button>
                    ) : (
                      <>
                        {onSpeak && <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Read Beari’s reply aloud" title="Read aloud" onClick={() => onSpeak(m.content)}><Volume2 className="h-4 w-4" /></button>}
                        <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="Copy Beari’s reply" title={copiedId === m.id ? "Copied" : "Copy reply"} onClick={() => void copyReply(m)}>{copiedId === m.id ? <span className="text-[10px]">OK</span> : <Copy className="h-4 w-4" />}</button>
                      </>
                    )}
                  </div>}
                </div>
              </div>
            )}
          </div>
        ))}
        {sending && (
          <div className="flex items-end gap-2">
            {messageAvatar}
            <p className="rounded-2xl rounded-bl-md border border-border bg-surface-2/50 px-4 py-3 text-sm text-muted" role="status">Beari is thinking…</p>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="shrink-0 border-t border-border p-4">
        {image && imagePreview && <div className="mb-3 flex items-start">
          <div className="relative h-[76px] w-[76px] overflow-hidden rounded-xl border border-border bg-surface" title={image.name}>
            <img src={imagePreview} alt={`Image ready to send: ${image.name}`} className="h-full w-full object-cover" />
            <button type="button" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white shadow-sm hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => { setImage(null); if (imageInputRef.current) imageInputRef.current.value = ""; }} aria-label="Remove attached image"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>}
        {(imageError || copyError) && <p role="alert" className="mb-2 text-xs text-danger">{imageError || copyError}</p>}
        <div className="flex items-end gap-2 sm:gap-3">
          <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={sending} onChange={(event) => selectImage(event.target.files?.[0])} aria-label="Attach an image" />
          <button type="button" className="grid h-11 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50" disabled={sending} onClick={() => imageInputRef.current?.click()} aria-label="Attach image" title="Attach a JPG, PNG, or WebP image"><ImagePlus className="h-5 w-5" /></button>
          <textarea
            ref={taRef}
            value={text}
            rows={1}
            maxLength={maxLength}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Message ${title}…`}
            aria-label={`Message ${title}`}
            className="input admin-chat-input max-h-[200px] min-w-0 flex-1 resize-none"
          />
          <button type="submit" className="btn-primary h-11 w-11 shrink-0 p-0" disabled={(!text.trim() && !image) || sending} aria-label="Send message">
            <Send className="h-4 w-4" />
          </button>
          {composerActions}
        </div>
        <div className="mt-2 flex justify-between text-xs text-faint">
          <span>Enter to send · Shift+Enter for a new line</span>
          <span>{text.length} / {maxLength.toLocaleString()}</span>
        </div>
      </form>
      {openImage && <div role="dialog" aria-modal="true" aria-label="Attached image preview" className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/85 p-4 sm:p-8">
        <button type="button" className="absolute inset-0 cursor-zoom-out" onClick={() => setOpenImage(null)} aria-label="Close image preview" />
        <div className="pointer-events-none relative z-10 flex h-full w-full items-center justify-center">
          <img src={openImage} alt="Full-size attached image" className="pointer-events-auto block max-h-[calc(100dvh-3rem)] max-w-[calc(100vw-2rem)] rounded-xl object-contain shadow-2xl sm:max-h-[calc(100dvh-5rem)] sm:max-w-[calc(100vw-5rem)]" />
        </div>
        <button type="button" className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/65 text-white transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={() => setOpenImage(null)} aria-label="Close image preview"><X className="h-5 w-5" /></button>
      </div>}
    </section>
  );
}
