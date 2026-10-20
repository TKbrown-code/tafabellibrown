import { Beari } from "@/lib/api";

export interface BeariChatRequest {
  message: string;
}

export interface BeariChatResponse {
  success: boolean;
  data: {
    answer: string;
    projects_mentioned: ProjectMention[];
    suggested_followups: string[];
  };
}

export interface ProjectMention {
  title: string;
  slug: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedFollowups?: string[];
  projectsMentioned?: ProjectMention[];
}

export function createMessageId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export async function sendBeariMessage(
  payload: BeariChatRequest,
): Promise<BeariChatResponse["data"]> {
  const { data } = await Beari.post<BeariChatResponse>(
    "/ai/chat",
    payload,
  );

  if (
    data.success !== true ||
    typeof data.data?.answer !== "string"
  ) {
    throw new Error("The AI server returned an unexpected response.");
  }

  return {
    answer: data.data.answer,
    projects_mentioned: Array.isArray(data.data.projects_mentioned)
      ? data.data.projects_mentioned.filter(
          (project): project is ProjectMention =>
            typeof project?.title === "string" &&
            typeof project?.slug === "string" &&
            project.title.length > 0 &&
            project.slug.length > 0,
        )
      : [],
    suggested_followups: Array.isArray(data.data.suggested_followups)
      ? data.data.suggested_followups
      : [],
  };
}

export async function sendBeariFeedback(payload: { rating: number; feedback: string }): Promise<void> {
  const { data } = await Beari.post<{ success: boolean }>("/ai/visitor/feedback", payload);
  if (data.success !== true) throw new Error("Beari feedback could not be saved.");
}

