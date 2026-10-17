export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface BeariRequest {
  message: string;
  history: { role: ChatRole; content: string }[];
  sessionId: string;
}

export interface BeariOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  endpoint?: string;
  headers?: Record<string, string>;
}

export class BeariError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "BeariError";
    this.status = status;
  }
}

/** Set VITE_BEARI_API_URL in .env to point at your backend route. */
const DEFAULT_ENDPOINT: string =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_BEARI_API_URL ?? "/api/beari";

export const createSessionId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const createMessageId = (): string => Math.random().toString(36).slice(2);

/**
 * ASSUMED CONTRACT (adjust to match backend/):
 *   POST { message, history, sessionId }  ->  JSON { reply }
 * Also accepts response / answer / message / text as the reply field.
 */
export async function sendBeariMessage(
  req: BeariRequest,
  { signal, timeoutMs = 30000, endpoint = DEFAULT_ENDPOINT, headers = {} }: BeariOptions = {},
): Promise<string> {
  const ac = new AbortController();
  const onAbort = () => ac.abort();
  signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(req),
      signal: ac.signal,
    });
    if (!res.ok) throw new BeariError(`Beari request failed (${res.status})`, res.status);

    const data = await res.json();
    const reply = data?.reply ?? data?.response ?? data?.answer ?? data?.message ?? data?.text;
    if (typeof reply !== "string" || !reply.trim()) throw new BeariError("Empty reply from Beari");
    return reply;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
