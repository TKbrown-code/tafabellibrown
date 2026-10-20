import { useEffect, useRef, useState, type FormEvent, type Ref } from "react";
import { Link } from "react-router-dom";
import { BeariMarkdown } from "@/components/shared/BeariMarkdown";
import { BeariMascot, type BeariState } from "./BeariMascot";
import type { ChatMessage, ProjectMention } from "@/services/beari";

export type ChatStatus =
  | "idle"
  | "loading"
  | "speaking"
  | "success"
  | "error";

export interface BeariChatProps {
  messages: ChatMessage[];
  status: ChatStatus;
  mood: BeariState;
  input: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  canRetry: boolean;
  errorMessage?: string;
  onInputChange: (value: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSubmit: () => void;
  onFollowup: (suggestion: string) => void;
  onRetry: () => void;
  onToggleVoice: () => void;
  isListening: boolean;
  voiceError?: string | null;
  onFeedbackSubmit: (rating: number, feedback: string) => Promise<void>;
  onClose: () => void;
}

const FEEDBACK_SESSION_KEY = "beari.feedback.completed.v1";

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      d="M6 6l12 12M18 6L6 18"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      d="M5 12h13M13 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function followupDestination(
  suggestion: string,
  projects: ProjectMention[],
): { to: string; state?: { scrollTo: string } } | null {
  const normalized = suggestion.toLowerCase();
  const project = projects.find((item) =>
    normalized.includes(item.title.toLowerCase()),
  );
  if (project) return { to: `/projects/${project.slug}` };
  if (/contact|hire|reach out|get in touch/.test(normalized)) {
    return { to: "/", state: { scrollTo: "contact" } };
  }
  if (/blog|post|article|writing/.test(normalized)) return { to: "/blog" };
  if (/skill|technology|tech stack/.test(normalized)) {
    return { to: "/", state: { scrollTo: "skills" } };
  }
  if (/project|work|case study/.test(normalized)) {
    return { to: "/", state: { scrollTo: "projects" } };
  }
  return null;
}

export default function BeariChat({
  messages,
  status,
  mood,
  input,
  placeholder = "Ask Beari something",
  inputRef,
  canRetry,
  errorMessage,
  onInputChange,
  onFocusChange,
  onSubmit,
  onFollowup,
  onRetry,
  onToggleVoice,
  isListening,
  voiceError,
  onFeedbackSubmit,
  onClose,
}: BeariChatProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [feedbackCompleted, setFeedbackCompleted] = useState(() => {
    try { return sessionStorage.getItem(FEEDBACK_SESSION_KEY) === "1"; } catch { return false; }
  });
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackPending, setFeedbackPending] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackThanks, setFeedbackThanks] = useState(false);
  const assistantReplies = messages.filter((message) => message.role === "assistant" && message.id !== "greeting").length;

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

  useEffect(() => {
    if (assistantReplies >= 2 && !feedbackCompleted) setFeedbackOpen(true);
  }, [assistantReplies, feedbackCompleted]);

  const dismissFeedback = () => {
    setFeedbackOpen(false);
    setFeedbackCompleted(true);
    try { sessionStorage.setItem(FEEDBACK_SESSION_KEY, "1"); } catch { /* Feedback prompt stays dismissed for this open chat. */ }
  };

  const submitFeedback = async () => {
    if (!rating || feedbackPending) return;
    setFeedbackPending(true);
    setFeedbackError("");
    try {
      await onFeedbackSubmit(rating, feedbackText.trim());
      setFeedbackThanks(true);
      window.setTimeout(dismissFeedback, 1800);
    } catch {
      setFeedbackError("Feedback could not be sent. Please try again.");
    } finally {
      setFeedbackPending(false);
    }
  };

  const subtitle =
    status === "loading"
      ? "Thinking…"
      : status === "speaking"
        ? "Replying…"
        : status === "success"
          ? "Here to help"
          : status === "error"
            ? "Something went wrong"
            : "Ask me about Tafa's portfolio";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (input.trim() && status !== "loading") {
      onSubmit();
    }
  };

  return (
    <section
      className="beari-window"
      role="dialog"
      aria-label="Chat with Beari"
      aria-modal="false"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <header className="beari-header">
        <BeariMascot
          state={mood}
          gaze={{ x: 0, y: 1 }}
          size={44}
          title=""
        />

        <div className="beari-heading">
          <strong>Beari</strong>
          <span className="beari-sub" aria-live="polite">
            {subtitle}
          </span>
        </div>

        <button
          type="button"
          className="beari-icon"
          aria-label="Close chat"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </header>

      <div
        className="beari-list"
        ref={listRef}
        role="log"
        aria-label="Conversation with Beari"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((message) => (
          <div key={message.id} className="beari-message-group">
            <div className={`beari-row beari-${message.role}`}>
              {message.role === "assistant" && (
                <BeariMascot
                  size={28}
                  animate={false}
                  title=""
                />
              )}

              {message.role === "assistant" ? (
                <div className="beari-bubble"><BeariMarkdown>{message.content}</BeariMarkdown></div>
              ) : (
                <p className="beari-bubble">{message.content}</p>
              )}
            </div>

            {message.role === "assistant" &&
              message.projectsMentioned &&
              message.projectsMentioned.length > 0 && (
                <div className="beari-projects">
                  <span className="beari-section-label">
                    Mentioned projects
                  </span>

                  <div className="beari-suggestions">
                    {message.projectsMentioned.map((project) => (
                      <Link
                        key={project.slug}
                        to={`/projects/${project.slug}`}
                        className="beari-project-tag"
                      >
                        {project.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            {message.role === "assistant" &&
              message.suggestedFollowups &&
              message.suggestedFollowups.length > 0 && (
                <div className="beari-followups">
                  <span className="beari-section-label">
                    You could also ask
                  </span>

                  <div className="beari-suggestions">
                    {message.suggestedFollowups.map((suggestion) => (
                      (() => {
                        const destination = followupDestination(
                          suggestion,
                          message.projectsMentioned ?? [],
                        );
                        return destination ? (
                          <Link
                            key={suggestion}
                            to={destination.to}
                            state={destination.state}
                            className="beari-suggestion"
                          >
                            {suggestion}
                            <span aria-hidden="true"> ↗</span>
                          </Link>
                        ) : (
                          <button
                            key={suggestion}
                            type="button"
                            className="beari-suggestion"
                            disabled={status === "loading"}
                            onClick={() => onFollowup(suggestion)}
                          >
                            {suggestion}
                            <span aria-hidden="true"> ↗</span>
                          </button>
                        );
                      })()
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}

        {status === "loading" && (
          <div className="beari-row beari-assistant">
            <BeariMascot
              size={28}
              animate={false}
              state="thinking"
              title=""
            />

            <p className="beari-bubble">
              <span
                className="beari-dots"
                role="status"
                aria-label="Beari is thinking"
              >
                <i />
                <i />
                <i />
              </span>
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="beari-row beari-assistant">
            <BeariMascot
              size={28}
              animate={false}
              state="apologetic"
              title=""
            />

            <div className="beari-bubble beari-error" role="alert">
              <p>
                {errorMessage ??
                  "Sorry, I couldn't get an answer just now. Please check your connection and try again."}
              </p>

              {canRetry && (
                <button
                  type="button"
                  className="beari-retry"
                  onClick={onRetry}
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {voiceError && <p className="beari-voice-error" role="status">{voiceError}</p>}

      {feedbackOpen && !feedbackCompleted && (
        <section className="beari-feedback" aria-label="Rate your Beari chat" aria-live="polite">
          <button type="button" className="beari-feedback-close" aria-label="Close feedback prompt" onClick={dismissFeedback}><CloseIcon /></button>
          {feedbackThanks ? <p className="beari-feedback-thanks">Thanks for helping Beari get better.</p> : <>
            <p className="beari-feedback-title">How was your chat with Beari?</p>
            <p className="beari-feedback-copy">A quick rating helps improve the visitor assistant.</p>
            <div className="beari-rating" role="group" aria-label="Rate Beari from 1 to 5 stars">
              {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`${value} out of 5 stars`} aria-pressed={rating === value} className={`beari-star ${rating >= value ? "is-selected" : ""}`} onClick={() => setRating(value)}>★</button>)}
            </div>
            <label className="beari-feedback-label" htmlFor="beari-feedback-text">Anything we could improve? <span>Optional</span></label>
            <textarea id="beari-feedback-text" className="beari-feedback-input" value={feedbackText} maxLength={600} onChange={(event) => setFeedbackText(event.target.value)} placeholder="Share a quick note…" rows={2} />
            {feedbackError && <p className="beari-feedback-error" role="alert">{feedbackError}</p>}
            <div className="beari-feedback-actions"><button type="button" className="beari-feedback-skip" onClick={dismissFeedback}>Not now</button><button type="button" className="beari-feedback-submit" onClick={() => void submitFeedback()} disabled={!rating || feedbackPending}>{feedbackPending ? "Sending…" : "Send feedback"}</button></div>
          </>}
        </section>
      )}

      <form className="beari-form" onSubmit={handleSubmit}>
        <button type="button" className={`beari-mic ${isListening ? "is-listening" : ""}`} aria-label={isListening ? "Stop voice input" : "Start voice input"} aria-pressed={isListening} title={isListening ? "Listening… click to stop" : "Speak to Beari"} onClick={onToggleVoice} disabled={status === "loading"}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-3 0h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
        <input
          ref={inputRef}
          value={input}
          placeholder={placeholder}
          aria-label="Message Beari"
          maxLength={1000}
          autoComplete="off"
          onChange={(event) => onInputChange(event.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
        />

        <button
          type="submit"
          className="beari-send"
          aria-label="Send message"
          disabled={!input.trim() || status === "loading"}
        >
          <SendIcon />
        </button>
      </form>
    </section>
  );
}
