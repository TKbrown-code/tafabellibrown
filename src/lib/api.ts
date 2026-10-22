import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  Message,
  NewMessage,
  Post,
  Project,
  Service,
  Skill,
  TranslationSuffix,
} from "./types";

type Table = "projects" | "posts" | "skills" | "messages" | "services";
type Row = { id: string };

const SKILL_SEED: Skill[] = [
  ["frontend", "React"],
  ["frontend", "TypeScript"],
  ["frontend", "JavaScript (ES6+)"],
  ["frontend", "HTML5"],
  ["frontend", "CSS3"],
  ["frontend", "Tailwind CSS"],
  ["frontend", "Bootstrap"],
  ["backend", "Node.js"],
  ["backend", "Express.js"],
  ["backend", "REST APIs"],
  ["backend", "JWT Auth"],
  ["backend", "Server-Side Rendering"],
  ["data", "PostgreSQL"],
  ["data", "MongoDB"],
  ["data", "Supabase"],
  ["data", "Prisma"],
  ["data", "Drizzle ORM"],
  ["data", "Redis"],
  ["devops", "Git"],
  ["devops", "GitHub"],
  ["devops", "Docker"],
  ["devops", "Vercel"],
  ["devops", "Cloudflare"],
  ["devops", "Postman"],
  ["devops", "Figma"],
  ["testing", "Jest"],
  ["testing", "Mocha"],
  ["testing", "Cypress"],
].map(([category, name], sort_order) => ({
  id: `seed-${String(category)}-${String(sort_order)}`,
  category: category as Skill["category"],
  name: String(name),
  sort_order,
}));

// API clients
export const Beari = axios.create({
  baseURL: "/api",
  timeout: 180_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const servicesApi = axios.create({
  baseURL: "/api/services",
  timeout: 30_000,
  withCredentials: true,
});

// Authentication and admin profile
export async function loginAdmin(
  email: string,
  password: string,
  turnstileToken: string,
) {
  const response = await Beari.post("/auth/login", {
    email,
    password,
    turnstileToken,
  });
  return response.data.data;
}

export async function requestAdminMagicLink(
  email: string,
  turnstileToken: string,
): Promise<{ message: string }> {
  const response = await Beari.post("/auth/magic-link", {
    email,
    turnstileToken,
  });
  return response.data;
}

export async function getAdminSession() {
  const response = await Beari.get("/auth/session");
  return response.data.data;
}

export async function logoutAdmin() {
  await Beari.post("/auth/logout");
}

export async function completeAdminInvite(
  access_token: string,
  refresh_token: string,
) {
  const response = await Beari.post("/auth/callback", {
    access_token,
    refresh_token,
  });
  return response.data.data;
}

export async function fetchCurrentAdmin() {
  const response = await Beari.get("/admin/me");
  return response.data.data;
}

export async function updateCurrentAdminName(name: string) {
  const response = await Beari.patch("/admin/profile", { name });
  return response.data.data as {
    user_id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function changeCurrentAdminPassword(
  currentPassword: string,
  newPassword: string,
) {
  const response = await Beari.post("/auth/password", {
    currentPassword,
    newPassword,
  });
  return response.data as {
    success: boolean;
    message: string;
  };
}

// Site settings and media
export async function fetchAdminSiteSettings() {
  const response = await Beari.get("/admin/settings");
  return response.data.data as Record<string, unknown>;
}

export async function uploadServiceScreenshot(
  file: File,
): Promise<{ screenshot_path: string; screenshot_url: string }> {
  const response = await servicesApi.post("/screenshots", file, {
    headers: { "Content-Type": file.type },
  });
  return response.data.data;
}

export async function deleteServiceScreenshot(path: string) {
  await servicesApi.delete("/screenshots", { data: { path } });
}

export async function translateAdminFields(
  resource: "projects" | "posts" | "services" | "settings",
  fields: Record<string, string>,
) {
  const response = await Beari.post("/admin/translations/translate", {
    resource,
    fields,
  });
  return response.data.data as Record<
    TranslationSuffix,
    Record<string, string>
  >;
}

const LOCALES: TranslationSuffix[] = ["fr", "zh", "es", "ar", "pcm"];

export async function saveSiteSettings(
  data: Record<string, unknown>,
  reviewedTranslations?: Record<TranslationSuffix, Record<string, string>>,
) {
  const englishFields = Object.fromEntries(
    Object.entries(data)
      .filter(
        ([key, value]) =>
          key.endsWith("En") &&
          typeof value === "string" &&
          value.trim(),
      )
      .map(([key, value]) => [key, value as string]),
  );
  const merged = { ...data };

  for (const key of Object.keys(data).filter((item) => item.endsWith("En"))) {
    if (typeof data[key] !== "string" || !(data[key] as string).trim()) {
      for (const locale of LOCALES) {
        const localeName = `${locale[0].toUpperCase()}${locale.slice(1)}`;
        merged[`${key.slice(0, -2)}${localeName}`] = null;
      }
    }
  }

  if (Object.keys(englishFields).length) {
    const translations =
      reviewedTranslations ??
      (await translateAdminFields("settings", englishFields));

    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(
        translations[locale] ?? {},
      )) {
        merged[key] = value;
      }
    }
  }

  const response = await Beari.put("/admin/settings", { data: merged });
  return response.data.data;
}

export async function uploadProfileImage(
  file: File,
): Promise<{ profileImagePath: string; profileImageUrl: string }> {
  let upload = file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      800 / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    context?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    if (context) {
      const optimized = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp", 0.82);
      });

      if (optimized) {
        upload = new File(
          [optimized],
          file.name.replace(/\.[^.]+$/, ".webp"),
          {
            type: "image/webp",
            lastModified: file.lastModified,
          },
        );
      }
    }
  } catch (error) {
    upload = file;
    console.warn(
      "Profile image optimization failed; uploading the original file.",
      error,
    );
  }

  const response = await Beari.post("/admin/profile-image", upload, {
    headers: { "Content-Type": upload.type },
  });
  return response.data.data;
}

export async function uploadContentThumbnail(
  file: File,
  kind: "projects" | "blogs" | "resume",
): Promise<{ path: string; url: string }> {
  const response = await Beari.post(
    `/admin/content-image?kind=${kind}`,
    file,
    { headers: { "Content-Type": file.type } },
  );
  return response.data.data;
}

export async function uploadResumePdf(
  file: File,
): Promise<{ resumePath: string; resumeUrl: string }> {
  const body = await file.arrayBuffer();
  const response = await Beari.post("/admin/resume", body, {
    headers: { "Content-Type": "application/pdf" },
  });
  return response.data.data;
}

// Assistant and AI features
export type AssistantProfile = {
  enabled?: boolean;
  personality: string;
  instructions: string;
  greeting: string;
  systemPrompt?: string;
};

export type AssistantSettings = {
  visitor: AssistantProfile & { enabled: boolean };
  admin: AssistantProfile;
};

export async function getAssistantSettings() {
  const response = await Beari.get("/ai/admin/assistant/settings");
  return response.data.data as AssistantSettings;
}

export async function fetchPublicAssistantConfig() {
  const response = await Beari.get("/ai/config");
  return response.data.data as {
    enabled: boolean;
    greeting: string;
  };
}

export async function suggestVisitorContactMessages(
  subject: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await Beari.post(
    "/ai/visitor/contact-suggestions",
    { subject },
    { signal },
  );
  return response.data.data.suggestions as string[];
}

export async function saveAssistantSettings(data: AssistantSettings) {
  const response = await Beari.put(
    "/ai/admin/assistant/settings",
    data,
  );
  return response.data.data as AssistantSettings;
}

export type AdminAssistantImage = {
  path: string;
  url: string;
};

export type AdminAssistantFile = {
  name: string;
  url: string;
  downloadUrl: string;
  previewPdf?: boolean;
  previewUrl?: string;
};
export function adminAssistantImageUrl(path: string) {
  return `/api/ai/admin/assistant/image?path=${encodeURIComponent(path)}`;
}
export async function uploadAdminAssistantImage(
  file: File,
): Promise<AdminAssistantImage> {
  const response = await Beari.post(
    "/ai/admin/assistant/image",
    file,
    { headers: { "Content-Type": file.type } },
  );
  return response.data.data;
}

export async function sendAdminAssistantMessage(
  message: string,
  context?: string,
  image?: File,
  imagePath?: string,
  onImageStored?: (image: AdminAssistantImage) => void,
) {
  let storedImage = imagePath
    ? { path: imagePath, url: adminAssistantImageUrl(imagePath) }
    : undefined;

  try {
    if (image && !storedImage) {
      storedImage = await uploadAdminAssistantImage(image);
      onImageStored?.(storedImage);
    }

    const response = await Beari.post(
      "/ai/admin/assistant/chat",
      {
        message,
        ...(context ? { context } : {}),
        ...(storedImage ? { imagePath: storedImage.path } : {}),
      },
    );
    const result = response.data.data as {
      answer: string;
      fileAttachment?: AdminAssistantFile;
      resumeUnavailable?: boolean;
    };

    return { ...result, ...(storedImage ?? {}) };
  } catch (error) {
    if (storedImage && error && typeof error === "object") {
      Object.assign(error, storedImage);
    }
    throw error;
  }
}

export type CalendarTaskSuggestion = {
  title: string;
  details: string;
  location: string;
};

export async function suggestCalendarTask(input: {
  title: string;
  details: string;
  location: string;
  dueAt: string;
}): Promise<CalendarTaskSuggestion> {
  const response = await Beari.post(
    "/ai/admin/assistant/task-suggestion",
    input,
  );
  return response.data.data as CalendarTaskSuggestion;
}

export async function fetchAdminAssistantHistory() {
  const response = await Beari.get("/ai/admin/assistant/chat");
  const history = response.data.data as Array<{
    role: "user" | "assistant";
    content: string;
    imagePath?: string;
    fileAttachment?: AdminAssistantFile;
  }>;

  return history.map((item) => ({
    ...item,
    ...(item.imagePath
      ? { imagePreview: adminAssistantImageUrl(item.imagePath) }
      : {}),
    ...(item.fileAttachment
      ? {
          fileAttachment: {
            ...item.fileAttachment,
            previewPdf:
              item.fileAttachment.previewPdf ??
              /résumé|resume/i.test(item.fileAttachment.name),
          },
        }
      : {}),
  }));
}

export type ResumeSuggestionItem = {
  id: string;
  text: string;
  insert?: string;
};

export async function getResumeSuggestions(content: string) {
  const response = await Beari.post(
    "/ai/admin/assistant/resume-suggestions",
    { content },
  );
  return response.data.data as {
    suggestions: string;
    items?: ResumeSuggestionItem[];
  };
}

// Admin analytics and account management
export async function fetchAdminAnalytics(days = 30) {
  const response = await Beari.get(`/admin/analytics?days=${days}`);
  return response.data.data;
}

export type AdminVisitorVisit = {
  visitedAt: string;
  country: string | null;
  city: string | null;
  path: string;
  deviceType: "mobile" | "tablet" | "desktop" | null;
};

export type AdminBeariFeedback = {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
};

export async function fetchAdminVisitorFeedback(): Promise<
  AdminBeariFeedback[]
> {
  const response = await Beari.get("/admin/visitor-feedback");
  return response.data.data;
}

export async function clearAdminVisitorFeedback(): Promise<number> {
  const response = await Beari.delete("/admin/visitor-feedback");
  return response.data.data.cleared;
}

export async function clearAdminVisitorAnalytics(): Promise<number> {
  const response = await Beari.delete("/admin/visitor-analytics");
  return response.data.data.cleared;
}

export async function fetchAdminSystem() {
  const response = await Beari.get("/admin/system");
  return response.data.data;
}

export type AdminAccount = {
  user_id: string;
  name: string;
  email: string;
  role: "admin" | "superAdmin";
  created_at: string;
};

export async function fetchAdminAccounts(): Promise<AdminAccount[]> {
  const response = await Beari.get("/admin/admins");
  return response.data.data;
}

export async function inviteAdminAccount(input: {
  name: string;
  email: string;
  temporaryPassword: string;
}): Promise<AdminAccount> {
  const response = await Beari.post("/admin/admins", input);
  return response.data.data;
}

export async function updateAdminAccount(
  id: string,
  input: Pick<AdminAccount, "name" | "email" | "role">,
): Promise<AdminAccount> {
  const response = await Beari.patch(
    `/admin/admins/${encodeURIComponent(id)}`,
    input,
  );
  return response.data.data;
}

export async function deleteAdminAccount(id: string): Promise<void> {
  await Beari.delete(`/admin/admins/${encodeURIComponent(id)}`);
}

// Blog scheduling
export type BlogSchedule = {
  enabled: boolean;
  timezone: string;
  postTimes: string[];
  updatedAt: string;
};

export type BlogScheduleRun = {
  id: string;
  scheduled_for: string;
  status: "running" | "published" | "skipped" | "failed";
  started_at: string;
  finished_at: string | null;
  post_slug: string | null;
  source_url: string | null;
  article_title: string | null;
  error_summary: string | null;
};

export async function fetchBlogSchedule(): Promise<{
  schedule: BlogSchedule;
  runs: BlogScheduleRun[];
}> {
  const response = await Beari.get("/admin/blog-schedule");
  return response.data.data;
}

export async function saveBlogSchedule(
  schedule: Pick<BlogSchedule, "enabled" | "timezone" | "postTimes">,
): Promise<BlogSchedule> {
  const response = await Beari.put("/admin/blog-schedule", schedule);
  return response.data.data;
}

export async function triggerBlogPublish(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await Beari.post("/admin/blog-schedule/run");
  return response.data;
}

// Notifications and API logs
export type AdminNotificationCursor = {
  updatedAt: string;
  id: string;
};

export async function fetchAdminNotifications(cursor?: AdminNotificationCursor) {
  const response = await Beari.get("/admin/notifications", {
    params: cursor ? { before: cursor.updatedAt, beforeId: cursor.id } : undefined,
  });
  return response.data.data;
}

export type AdminApiLog = {
  id: string;
  type: "info" | "warn" | "error";
  service: string;
  message: string;
  method: string | null;
  path: string | null;
  status_code: number | null;
  duration_ms: number | null;
  created_at: string;
};

export type AdminApiServiceMetric = {
  service: string;
  requests: number;
  events: number;
  errors: number;
  warnings: number;
  averageDurationMs: number;
  p95DurationMs: number;
};

export type AdminApiHealth = {
  api: {
    ok: boolean;
    uptimeSeconds: number;
    nodeVersion: string;
  };
  database: {
    ok: boolean;
    durationMs: number;
  };
  redis: {
    ok: boolean;
    durationMs: number | null;
  };
  memory: {
    rssBytes: number;
    heapUsedBytes: number;
    heapTotalBytes: number;
    externalBytes: number;
  };
};

export type AdminStorageMetrics = {
  objects: number;
  bytes: number;
  buckets: {
    bucket: string;
    objects: number;
    bytes: number;
    lastObjectAt: string | null;
  }[];
};

export type AdminCloudflareStorageMetrics = {
  configured: boolean;
  bucket: string | null;
  objects: number | null;
  bytes: number | null;
  lastObjectAt: string | null;
};

export type AdminAccessMetrics = {
  pageViews: number;
  uniqueVisitors: number;
  topPaths: { path: string; views: number }[];
  devices: Record<string, number>;
};

export type AdminApiMetrics = {
  requests: number;
  errors: number;
  warnings: number;
  clientErrors: number;
  serverErrors: number;
  averageDurationMs: number;
  p95DurationMs: number;
  timeline: {
    hour: string;
    requests: number;
    errors: number;
    warnings: number;
    averageDurationMs: number;
    pageViews: number;
  }[];
  services: AdminApiServiceMetric[];
  endpoints: {
    method: string;
    path: string;
    requests: number;
    failures: number;
    averageDurationMs: number;
  }[];
  statusGroups: Record<string, number>;
  health: AdminApiHealth;
  storage: AdminStorageMetrics | null;
  cloudflareStorage: AdminCloudflareStorageMetrics | null;
  access: AdminAccessMetrics;
  beari: {
    responses: number;
    failures: number;
    averageDurationMs: number;
  };
};

export async function fetchAdminApiLogs(): Promise<AdminApiLog[]> {
  const response = await Beari.get("/admin/logs");
  return response.data.data;
}

export async function fetchAdminApiMetrics(): Promise<AdminApiMetrics> {
  const response = await Beari.get("/admin/logs/metrics");
  return response.data.data;
}

export async function markAdminNotificationRead(id: string) {
  await Beari.patch(
    `/admin/notifications/${encodeURIComponent(id)}/read`,
  );
}

export async function markAllAdminNotificationsRead() {
  await Beari.patch("/admin/notifications/read-all");
}

export async function clearAdminNotifications(): Promise<number> {
  const response = await Beari.delete("/admin/notifications");
  return response.data.data.cleared;
}

export async function clearAdminApiLogs(): Promise<{
  apiLogsCleared: number;
  scheduleRunsHidden: number;
}> {
  const response = await Beari.delete("/admin/logs");
  return response.data.data;
}

// Calendar and messaging
export type CalendarTask = {
  id: string;
  title: string;
  details: string;
  location: string;
  due_at: string;
  time_zone: string;
  reminder_at: string | null;
  reminder_email: string;
  reminder_sent_at: string | null;
  completed: boolean;
  created_at: string;
};

export async function fetchCalendarTasks(): Promise<CalendarTask[]> {
  const response = await Beari.get("/admin/calendar/tasks");
  return response.data.data;
}

export async function createCalendarTask(input: {
  title: string;
  details: string;
  location: string;
  due_at: string;
  time_zone: string;
  reminder_at: string | null;
}): Promise<CalendarTask> {
  const response = await Beari.post("/admin/calendar/tasks", input);
  return response.data.data;
}

export async function updateCalendarTask(
  id: string,
  completed: boolean,
): Promise<CalendarTask> {
  const response = await Beari.patch(
    `/admin/calendar/tasks/${encodeURIComponent(id)}`,
    { completed },
  );
  return response.data.data;
}

export async function deleteCalendarTask(id: string) {
  await Beari.delete(`/admin/calendar/tasks/${encodeURIComponent(id)}`);
}

export async function getBeariEmailStatus(): Promise<{
  configured: boolean;
}> {
  const response = await Beari.get("/admin/calendar/email-status");
  return response.data.data;
}

export async function sendBeariEmail(input: {
  to: string;
  subject: string;
  message: string;
}) {
  const response = await Beari.post("/admin/calendar/email", input);
  return response.data.data;
}

export async function suggestMessageReply(input: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): Promise<{ suggestion: string }> {
  const response = await Beari.post(
    "/ai/admin/assistant/message-reply-suggestion",
    input,
  );
  return response.data.data;
}

export type ProjectCodeSuggestion = {
  title: string;
  language: string;
  code: string;
};

export async function suggestProjectCode(input: {
  title: string;
  tech: string[];
  problem: string;
  approach: string;
  results: string;
  existingTitles: string[];
}): Promise<{ suggestions: ProjectCodeSuggestion[] }> {
  const response = await Beari.post(
    "/ai/admin/assistant/project-code-suggestions",
    input,
  );
  return response.data.data;
}

export type ContentSuggestionResource = "posts" | "services" | "projects";
export type ContentSuggestionField =
  | "title"
  | "excerpt"
  | "content"
  | "description"
  | "summary";

export async function suggestAdminContentField(
  input: {
    resource: ContentSuggestionResource;
    field: ContentSuggestionField;
    value: string;
    context: Record<string, string>;
  },
  signal?: AbortSignal,
): Promise<{ suggestion: string }> {
  const response = await Beari.post(
    "/ai/admin/assistant/content-suggestions",
    input,
    { signal },
  );
  return response.data.data;
}

// Shared content operations
async function list<T extends Row>(
  table: Table,
  admin = false,
): Promise<T[]> {
  if (table === "services") {
    const response = await servicesApi.get(admin ? "/admin" : "/");
    return response.data.data as T[];
  }

  const response = admin
    ? await Beari.get(`/admin/content/${table}`)
    : await Beari.get(`/content/${table}`);
  return response.data.data as T[];
}

async function upsert<T extends Row>(
  table: Table,
  row: Partial<T> & { id?: string },
): Promise<T> {
  if (table === "projects" || table === "posts" || table === "services") {
    const reviewedFingerprint = (
      row as Partial<T> & {
        __translationSourceFingerprint?: string;
      }
    ).__translationSourceFingerprint;

    const fields =
      table === "projects"
        ? [
            "title",
            "tagline",
            "summary",
            "role",
            "problem",
            "approach",
            "results",
          ]
        : table === "posts"
          ? ["title", "excerpt", "content"]
          : [
              "category",
              "subcategory",
              "title",
              "description",
              "screenshot_alt",
            ];

    const english = Object.fromEntries(
      fields
        .filter((key) => {
          const value = (row as Record<string, unknown>)[key];
          return typeof value === "string" && value.trim();
        })
        .map((key) => [
          key,
          (row as Record<string, unknown>)[key] as string,
        ]),
    );

    if (
      table === "projects" &&
      Array.isArray((row as Partial<Project>).metrics)
    ) {
      (row as Partial<Project>).metrics!.forEach((metric, index) => {
        if (metric.label.trim()) {
          english[`metricLabel${index}`] = metric.label;
        }
      });
    }

    if (
      table === "projects" &&
      Array.isArray((row as Partial<Project>).code_snippets)
    ) {
      (row as Partial<Project>).code_snippets!.forEach(
        (snippet, index) => {
          if (snippet.title.trim()) {
            english[`snippetTitle${index}`] = snippet.title;
          }
        },
      );
    }

    const translationReviewed =
      reviewedFingerprint === JSON.stringify(english);
    const translated = { ...row } as Record<string, unknown>;

    // Clear stale translations whenever an English source field is empty.
    for (const key of fields) {
      if (!english[key]) {
        for (const locale of LOCALES) {
          translated[`${key}_${locale}`] = null;
        }
      }
    }

    if (Object.keys(english).length && !translationReviewed) {
      const translations = await translateAdminFields(table, english);

      for (const locale of LOCALES) {
        for (const [key, value] of Object.entries(
          translations[locale] ?? {},
        )) {
          const metric = /^metricLabel(\d+)_(?:fr|zh|es|ar|pcm)$/.exec(
            key,
          );
          const snippet = /^snippetTitle(\d+)_(?:fr|zh|es|ar|pcm)$/.exec(
            key,
          );

          if (metric && Array.isArray(translated.metrics)) {
            const index = Number(metric[1]);
            translated.metrics = (
              translated.metrics as Project["metrics"]
            ).map((item, itemIndex) =>
              itemIndex === index
                ? { ...item, [`label_${locale}`]: value }
                : item,
            );
          } else if (
            snippet &&
            Array.isArray(translated.code_snippets)
          ) {
            const index = Number(snippet[1]);
            translated.code_snippets = (
              translated.code_snippets as NonNullable<
                Project["code_snippets"]
              >
            ).map((item, itemIndex) =>
              itemIndex === index
                ? { ...item, [`title_${locale}`]: value }
                : item,
            );
          } else {
            translated[key] = value;
          }
        }
      }
    }

    if (table === "projects" && Array.isArray(translated.metrics)) {
      translated.metrics = (
        translated.metrics as Project["metrics"]
      ).map((item) => {
        const cleaned: Record<string, unknown> = { ...item };

        for (const locale of LOCALES) {
          if (!item.label.trim()) {
            cleaned[`label_${locale}`] = null;
          }
        }

        return cleaned;
      });
    }

    delete translated.__translationSourceFingerprint;
    row = translated as Partial<T> & { id?: string };
  }

  if (table === "services") {
    const { id, ...payload } = row;
    const response = id
      ? await servicesApi.put(`/${id}`, payload)
      : await servicesApi.post("/", payload);
    return response.data.data as T;
  }

  if (table === "messages") {
    if (
      !row.id ||
      typeof (row as Partial<Message>).is_read !== "boolean"
    ) {
      throw new Error("Invalid message update.");
    }

    const response = await Beari.patch(
      `/admin/messages/${encodeURIComponent(row.id)}`,
      { is_read: (row as Partial<Message>).is_read },
    );
    return response.data.data as T;
  }

  if (row.id) {
    const { id, ...payload } = row;
    const response = await Beari.put(
      `/admin/content/${table}/${encodeURIComponent(id)}`,
      payload,
    );
    return response.data.data as T;
  }

  const response = await Beari.post(`/admin/content/${table}`, row);
  return response.data.data as T;
}

async function remove(table: Table, id: string) {
  if (table === "services") {
    await servicesApi.delete(`/${encodeURIComponent(id)}`);
    return;
  }

  if (table === "messages") {
    await Beari.delete(`/admin/messages/${encodeURIComponent(id)}`);
    return;
  }

  await Beari.delete(`/admin/content/${table}/${encodeURIComponent(id)}`);
}

export async function sendMessage(
  message: NewMessage & {
    website?: string;
    turnstileToken: string;
  },
) {
  await Beari.post("/messages", message);
}

// React Query hooks
const PUBLIC_CONTENT_STALE_TIME = 5 * 60_000;

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: () => list<Project>("projects"),
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });

export const usePosts = () =>
  useQuery({
    queryKey: ["posts"],
    queryFn: () => list<Post>("posts"),
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });

export const useSkills = () =>
  useQuery({
    queryKey: ["skills"],
    queryFn: () => list<Skill>("skills"),
    initialData: SKILL_SEED,
    initialDataUpdatedAt: 0,
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });

export const useServices = () =>
  useQuery({
    queryKey: ["services"],
    queryFn: () => list<Service>("services"),
    staleTime: PUBLIC_CONTENT_STALE_TIME,
  });

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "messages"],
      }),
  });
};

export const useAdminList = <T extends Row>(table: Table) =>
  useQuery({
    queryKey: ["admin", table],
    queryFn: () => list<T>(table, true),
  });

export const useAdminSave = <T extends Row>(table: Table) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (row: Partial<T> & { id?: string }) =>
      upsert<T>(table, row),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", table],
      });
      void queryClient.invalidateQueries({
        queryKey: [table],
      });
    },
  });
};

export const useAdminDelete = (table: Table) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => remove(table, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", table],
      });
      void queryClient.invalidateQueries({
        queryKey: [table],
      });
    },
  });
};
