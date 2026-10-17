import { useEffect, useRef, type FormEvent, type Ref } from "react";
import { BeariMascot, type BeariState } from "./BeariMascot";
import type { ChatMessage } from "@/services/beari";

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
  onInputChange: (value: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSubmit: () => void;
  onFollowup: (suggestion: string) => void;
  onRetry: () => void;
  onClose: () => void;
}

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

export default function BeariChat({
  messages,
  status,
  mood,
  input,
  placeholder = "Ask Beari something",
  inputRef,
  canRetry,
  onInputChange,
  onFocusChange,
  onSubmit,
  onFollowup,
  onRetry,
  onClose,
}: BeariChatProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, status]);

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

              <p className="beari-bubble">{message.content}</p>
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
                      <span
                        key={project}
                        className="beari-project-tag"
                      >
                        {project}
                      </span>
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
                Sorry, I couldn't get an answer just now. Please check your
                connection and try again.
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

      <form className="beari-form" onSubmit={handleSubmit}>
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
