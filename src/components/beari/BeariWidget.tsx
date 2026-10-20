import { useCallback, useEffect, useRef, useState } from "react";
import { BeariMascot, type BeariState } from "./BeariMascot";
import BeariChat, { type ChatStatus } from "./BeariChat";
import {
  createMessageId,
  sendBeariFeedback,
  sendBeariMessage,
  type ChatMessage,
  type ProjectMention,
} from "@/services/beari";
import "./beari.css";

type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export interface BeariWidgetProps {
  greeting?: string;
  placeholder?: string;
  defaultOpen?: boolean;
}

const TRANSCRIPT_KEY = "beari.transcript.v1";
const WELCOME_SEEN_KEY = "beari.welcome-seen.v1";
const TRANSCRIPT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_VISIBLE_HISTORY = 10;

function isStoredMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function restoreMessages(greeting: string): ChatMessage[] {
  const initial: ChatMessage = {
    id: "greeting",
    role: "assistant",
    content: greeting,
  };

  try {
    const raw = sessionStorage.getItem(TRANSCRIPT_KEY);
    if (!raw) return [initial];

    const stored = JSON.parse(raw) as { savedAt?: unknown; messages?: unknown };
    if (
      typeof stored.savedAt !== "number" ||
      Date.now() - stored.savedAt > TRANSCRIPT_TTL_MS ||
      !Array.isArray(stored.messages)
    ) {
      sessionStorage.removeItem(TRANSCRIPT_KEY);
      return [initial];
    }

    const restored = stored.messages
      .filter(isStoredMessage)
      .slice(-MAX_VISIBLE_HISTORY)
      .map((message) => {
        const record = message as ChatMessage & Record<string, unknown>;
        const projectMentions = Array.isArray(record.projectsMentioned)
          ? record.projectsMentioned.filter(
              (project): project is ProjectMention =>
                Boolean(project) &&
                typeof project === "object" &&
                typeof (project as ProjectMention).title === "string" &&
                typeof (project as ProjectMention).slug === "string",
            )
          : undefined;
        return {
          ...message,
          suggestedFollowups: Array.isArray(record.suggestedFollowups)
            ? record.suggestedFollowups.filter(
                (item): item is string => typeof item === "string",
              )
            : undefined,
          projectsMentioned: projectMentions,
        };
      });

    return [initial, ...restored];
  } catch {
    return [initial];
  }
}

export default function BeariWidget({
  greeting = "Hi, I'm Beari, Tafa's portfolio assistant. Ask me about his projects, skills, or how to get in touch.",
  placeholder,
  defaultOpen = false,
}: BeariWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    restoreMessages(greeting),
  );

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [focused, setFocused] = useState(false);
  const [welcoming, setWelcoming] = useState(false);
  const [hover, setHover] = useState(false);
  const [gaze, setGaze] = useState<{ x: number; y: number } | null>(null);
  const [asleep, setAsleep] = useState(false);
  const [failedText, setFailedText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const timers = useRef<number[]>([]);
  const alive = useRef(false);
  const requestInProgress = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const later = useCallback(
    (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.current = timers.current.filter((timer) => timer !== id);
        if (alive.current) fn();
      }, ms);

      timers.current.push(id);
    },
    [],
  );

  useEffect(() => {
    alive.current = true;

    return () => {
      alive.current = false;
      clearTimers();
      speechRef.current?.stop();
      speechRef.current = null;
      setIsListening(false);
      abortRef.current?.abort();
    };
  }, [clearTimers]);

  useEffect(() => {
    const transcript = messages
      .filter((message) => message.id !== "greeting")
      .slice(-MAX_VISIBLE_HISTORY);
    try {
      if (transcript.length === 0) {
        sessionStorage.removeItem(TRANSCRIPT_KEY);
      } else {
        sessionStorage.setItem(
          TRANSCRIPT_KEY,
          JSON.stringify({ savedAt: Date.now(), messages: transcript }),
        );
      }
    } catch {
      // The chat still works if browser storage is unavailable.
    }
  }, [messages]);

  // Keep the mascot's expression synchronized with the chat state.
  const mood: BeariState =
    status === "loading"
      ? "thinking"
      : status === "speaking"
        ? "speaking"
        : status === "success"
          ? "happy"
          : status === "error"
            ? "apologetic"
            : open && welcoming
              ? "welcome"
              : open && input.trim()
                ? "listening"
                : open && focused
                  ? "curious"
                  : !open && asleep && !hover
                    ? "sleeping"
                    : "idle";

  // Let Beari sleep after one minute when the chat is closed.
  useEffect(() => {
    if (open || hover) {
      setAsleep(false);
      return;
    }

    const id = window.setTimeout(() => setAsleep(true), 60_000);

    return () => window.clearTimeout(id);
  }, [open, hover]);

  useEffect(() => {
    if (open) {
      setWelcomeVisible(false);
      return;
    }
    try {
      if (sessionStorage.getItem(WELCOME_SEEN_KEY)) return;
    } catch { /* Show the greeting if browser storage is unavailable. */ }
    const id = window.setTimeout(() => {
      setWelcomeVisible(true);
      try { sessionStorage.setItem(WELCOME_SEEN_KEY, "1"); } catch { /* The greeting still works without storage. */ }
    }, 1300);
    return () => window.clearTimeout(id);
  }, [open]);

  const openChat = useCallback(() => {
    setOpen(true);
    setWelcomeVisible(false);
    setAsleep(false);
    setWelcoming(true);

    later(() => setWelcoming(false), 1600);

    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, [later]);

  const closeChat = useCallback(() => {
    speechRef.current?.stop();
    speechRef.current = null;
    setIsListening(false);
    setOpen(false);
    setWelcoming(false);
    setFocused(false);

    // Do not cancel an in-flight request just because the panel closes.
    // The answer can still be displayed when the user reopens the chat.
    if (!requestInProgress.current) {
      clearTimers();
      setStatus("idle");
    }

    fabRef.current?.focus({ preventScroll: true });
  }, [clearTimers]);

  const toggleVoice = useCallback(() => {
    if (speechRef.current) {
      speechRef.current.stop();
      return;
    }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("Voice input is not supported in this browser. You can type your message instead.");
      return;
    }

    setVoiceError(null);
    const recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).slice(event.resultIndex).filter((result) => result.isFinal).map((result) => result[0].transcript.trim()).filter(Boolean).join(" ");
      if (transcript) setInput((current) => [current.trim(), transcript].filter(Boolean).join(" "));
    };
    recognition.onerror = (event) => {
      setVoiceError(event.error === "not-allowed" || event.error === "service-not-allowed" ? "Allow microphone access in your browser to use voice input." : "I couldn't hear that clearly. Please try again or type your message.");
    };
    recognition.onend = () => {
      speechRef.current = null;
      setIsListening(false);
    };
    speechRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      speechRef.current = null;
      setIsListening(false);
      setVoiceError("Voice input couldn't start. Please try again or type your message.");
    }
  }, []);

  const submit = useCallback(
    async (text: string, retry = false) => {
      const message = text.trim();

      if (!message || requestInProgress.current) return;

      clearTimers();
      speechRef.current?.stop();
      speechRef.current = null;
      setIsListening(false);

      requestInProgress.current = true;
      setFailedText(null);
      setErrorMessage(null);
      setInput("");
      setStatus("loading");

      // Add the user's message only on the first attempt.
      // A retry reuses the original user message.
      if (!retry) {
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "user",
            content: message,
          },
        ]);
      }

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // The service returns:
        // { answer, projects_mentioned, suggested_followups }
        const response = await sendBeariMessage({ message });

        if (!alive.current || controller.signal.aborted) return;

        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "assistant",
            content: response.answer,
            suggestedFollowups: response.suggested_followups,
            projectsMentioned: response.projects_mentioned,
          },
        ]);

        const speakingDuration = Math.min(
          3500,
          Math.max(1200, response.answer.length * 25),
        );

        setStatus("speaking");

        later(() => {
          setStatus("success");
        }, speakingDuration);

        later(() => {
          setStatus("idle");
        }, speakingDuration + 1800);
      } catch (error) {
        if (!alive.current || controller.signal.aborted) return;

        const statusCode = (error as { response?: { status?: number } })
          ?.response?.status;
        setErrorMessage(
          statusCode === 429
            ? "You've reached Beari's short-term message limit. Please wait a little and try again."
            : "Sorry, I couldn't get an answer just now. Please check your connection and try again.",
        );
        setFailedText(message);
        setStatus("error");
      } finally {
        requestInProgress.current = false;

        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [clearTimers, later],
  );

  return (
    <div className="beari-root">
      {!open && welcomeVisible && (
        <div className="beari-welcome" role="status">
          <button type="button" className="beari-welcome-message" onClick={openChat} aria-label="Open Beari chat">
            <span className="beari-welcome-title"><span className="beari-welcome-dot" /> Beari <span className="beari-welcome-time">HERE TO HELP</span></span>
            <span className="beari-welcome-copy">{greeting}</span>
            <span className="beari-welcome-cta">Chat with me <span aria-hidden="true">→</span></span>
          </button>
          <button type="button" className="beari-welcome-close" onClick={() => setWelcomeVisible(false)} aria-label="Dismiss Beari welcome message">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}
      {open && (
        <BeariChat
          messages={messages}
          status={status}
          mood={mood}
          input={input}
          placeholder={placeholder}
          inputRef={inputRef}
          canRetry={failedText !== null}
          errorMessage={errorMessage ?? undefined}
          onInputChange={(value) => {
            setInput(value);

            if (status === "error") {
              setStatus("idle");
            }
          }}
          onFocusChange={setFocused}
          onSubmit={() => void submit(input)}
          onFollowup={(suggestion) => {
            void submit(suggestion);
          }}
          onRetry={() => {
            if (failedText) {
              void submit(failedText, true);
            }
          }}
          onToggleVoice={toggleVoice}
          isListening={isListening}
          voiceError={voiceError}
          onFeedbackSubmit={(rating, feedback) => sendBeariFeedback({ rating, feedback })}
          onClose={closeChat}
        />
      )}

      <button
        ref={fabRef}
        type="button"
        className="beari-fab"
        aria-label={open ? "Close Beari chat" : "Open Beari chat"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? closeChat() : openChat())}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") {
            setHover(true);
          }
        }}
        onPointerLeave={() => {
          setHover(false);
          setGaze(null);
        }}
        onPointerMove={(event) => {
          if (event.pointerType !== "mouse") return;

          const rect = event.currentTarget.getBoundingClientRect();

          setGaze({
            x: Math.max(
              -1,
              Math.min(
                1,
                (event.clientX - rect.left - rect.width / 2) /
                  (rect.width / 2),
              ),
            ),
            y: Math.max(
              -1,
              Math.min(
                1,
                (event.clientY - rect.top - rect.height / 2) /
                  (rect.height / 2),
              ),
            ),
          });
        }}
      >
        {open ? (
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
          >
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <BeariMascot
            state={mood}
            gaze={gaze}
            hovered={hover}
            size={50}
            title=""
          />
        )}
      </button>
    </div>
  );
}
