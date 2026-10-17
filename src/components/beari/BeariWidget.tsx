import { useCallback, useEffect, useRef, useState } from "react";
import { BeariMascot, type BeariState } from "./BeariMascot";
import BeariChat, { type ChatStatus } from "./BeariChat";
import {
  createMessageId,
  sendBeariMessage,
  type ChatMessage,
} from "@/services/beari";
import "./beari.css";

export interface BeariWidgetProps {
  greeting?: string;
  placeholder?: string;
  defaultOpen?: boolean;
}

export default function BeariWidget({
  greeting = "Hi, I'm Beari. Ask me about this portfolio, the projects, or how to get in touch.",
  placeholder,
  defaultOpen = false,
}: BeariWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      role: "assistant",
      content: greeting,
    },
  ]);

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [focused, setFocused] = useState(false);
  const [welcoming, setWelcoming] = useState(false);
  const [hover, setHover] = useState(false);
  const [gaze, setGaze] = useState<{ x: number; y: number } | null>(null);
  const [asleep, setAsleep] = useState(false);
  const [failedText, setFailedText] = useState<string | null>(null);

  const timers = useRef<number[]>([]);
  const alive = useRef(false);
  const requestInProgress = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);

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
      abortRef.current?.abort();
    };
  }, [clearTimers]);

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

  const openChat = useCallback(() => {
    setOpen(true);
    setAsleep(false);
    setWelcoming(true);

    later(() => setWelcoming(false), 1600);

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [later]);

  const closeChat = useCallback(() => {
    setOpen(false);
    setWelcoming(false);
    setFocused(false);

    // Do not cancel an in-flight request just because the panel closes.
    // The answer can still be displayed when the user reopens the chat.
    if (!requestInProgress.current) {
      clearTimers();
      setStatus("idle");
    }

    fabRef.current?.focus();
  }, [clearTimers]);

  const submit = useCallback(
    async (text: string, retry = false) => {
      const message = text.trim();

      if (!message || requestInProgress.current) return;

      clearTimers();

      requestInProgress.current = true;
      setFailedText(null);
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
      } catch {
        if (!alive.current || controller.signal.aborted) return;

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
      {open && (
        <BeariChat
          messages={messages}
          status={status}
          mood={mood}
          input={input}
          placeholder={placeholder}
          inputRef={inputRef}
          canRetry={failedText !== null}
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
