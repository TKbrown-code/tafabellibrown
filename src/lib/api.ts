import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message, NewMessage, Post, Project, Service, Skill, TranslationSuffix } from "./types";
import axios from "axios";

type Table = "projects" | "posts" | "skills" | "messages" | "services";
type Row = { id: string };
const SKILL_SEED: Skill[] = [
  ["frontend", "React"], ["frontend", "TypeScript"], ["frontend", "JavaScript (ES6+)"], ["frontend", "HTML5"], ["frontend", "CSS3"], ["frontend", "Tailwind CSS"], ["frontend", "Bootstrap"],
  ["backend", "Node.js"], ["backend", "Express.js"], ["backend", "REST APIs"], ["backend", "JWT Auth"], ["backend", "Server-Side Rendering"],
  ["data", "PostgreSQL"], ["data", "MongoDB"], ["data", "Supabase"], ["data", "Prisma"], ["data", "Drizzle ORM"], ["data", "Redis"],
  ["devops", "Git"], ["devops", "GitHub"], ["devops", "Docker"], ["devops", "Vercel"], ["devops", "Cloudflare"], ["devops", "Postman"], ["devops", "Figma"],
  ["testing", "Jest"], ["testing", "Mocha"], ["testing", "Cypress"],
].map(([category, name], sort_order) => ({ id: `seed-${String(category)}-${String(sort_order)}`, category: category as Skill["category"], name: String(name), sort_order }));

export const Beari = axios.create({ baseURL: "/api", timeout: 180_000, withCredentials: true, headers: { "Content-Type": "application/json" } });
const servicesApi = axios.create({ baseURL: "/api/services", timeout: 30_000, withCredentials: true });

export async function loginAdmin(email: string, password: string, turnstileToken: string) {
  return (await Beari.post("/auth/login", { email, password, turnstileToken })).data.data;
}
export async function requestAdminMagicLink(email: string, turnstileToken: string): Promise<{ message: string }> {
  return (await Beari.post("/auth/magic-link", { email, turnstileToken })).data;
}
export async function getAdminSession() {
  return (await Beari.get("/auth/session")).data.data;
}
export async function logoutAdmin() {
  await Beari.post("/auth/logout");
}
export async function completeAdminInvite(access_token: string, refresh_token: string) {
  return (await Beari.post("/auth/callback", { access_token, refresh_token })).data.data;
}
export async function fetchCurrentAdmin() {
  return (await Beari.get("/admin/me")).data.data;
}
export async function updateCurrentAdminName(name: string) {
  return (await Beari.patch("/admin/profile", { name })).data.data as { user_id: string; name: string; email: string; role: string };
}
export async function changeCurrentAdminPassword(currentPassword: string, newPassword: string) {
  return (await Beari.post("/auth/password", { currentPassword, newPassword })).data as { success: boolean; message: string };
}
export async function fetchAdminSiteSettings() { return (await Beari.get("/admin/settings")).data.data as Record<string, unknown>; }

export async function uploadServiceScreenshot(file: File): Promise<{ screenshot_path: string; screenshot_url: string }> {
  return (await servicesApi.post("/screenshots", file, { headers: { "Content-Type": file.type } })).data.data;
}
export async function deleteServiceScreenshot(path: string) { await servicesApi.delete("/screenshots", { data: { path } }); }
export async function translateAdminFields(resource: "projects" | "posts" | "services" | "settings", fields: Record<string, string>) {
  return (await Beari.post("/admin/translations/translate", { resource, fields })).data.data as Record<TranslationSuffix, Record<string, string>>;
}
const LOCALES: TranslationSuffix[] = ["fr", "zh", "es", "ar", "pcm"];
export async function saveSiteSettings(data: Record<string, unknown>, reviewedTranslations?: Record<TranslationSuffix, Record<string, string>>) {
  const englishFields = Object.fromEntries(Object.entries(data).filter(([key, value]) => key.endsWith("En") && typeof value === "string" && value.trim()).map(([key, value]) => [key, value as string]));
  const merged = { ...data };
  for (const key of Object.keys(data).filter((item) => item.endsWith("En"))) {
    if (typeof data[key] !== "string" || !(data[key] as string).trim()) for (const locale of LOCALES) merged[`${key.slice(0, -2)}${locale[0].toUpperCase()}${locale.slice(1)}`] = null;
  }
  if (Object.keys(englishFields).length) {
    const translations = reviewedTranslations ?? await translateAdminFields("settings", englishFields);
    for (const locale of LOCALES) for (const [key, value] of Object.entries(translations[locale] ?? {})) merged[key] = value;
  }
  return (await Beari.put("/admin/settings", { data: merged })).data.data;
}
export async function uploadProfileImage(file: File): Promise<{ profileImagePath: string; profileImageUrl: string }> {
  let upload = file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    context?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    if (context) {
      const optimized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
      if (optimized) upload = new File([optimized], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp", lastModified: file.lastModified });
    }
  } catch {
    // Keep the original upload if this browser cannot decode or encode WebP.
  }
  return (await Beari.post("/admin/profile-image", upload, { headers: { "Content-Type": upload.type } })).data.data;
}
export async function uploadContentThumbnail(file: File, kind: "projects" | "blogs" | "resume"): Promise<{ path: string; url: string }> {
  return (await Beari.post(`/admin/content-image?kind=${kind}`, file, { headers: { "Content-Type": file.type } })).data.data;
}
export async function uploadResumePdf(file: File): Promise<{ resumePath: string; resumeUrl: string }> {
  const body = await file.arrayBuffer();
  return (await Beari.post("/admin/resume", body, { headers: { "Content-Type": "application/pdf" } })).data.data;
}
export type AssistantProfile = { enabled?: boolean; personality: string; instructions: string; greeting: string; systemPrompt?: string };
export type AssistantSettings = { visitor: AssistantProfile & { enabled: boolean }; admin: AssistantProfile };
export async function getAssistantSettings() { return (await Beari.get("/ai/admin/assistant/settings")).data.data as AssistantSettings; }
export async function fetchPublicAssistantConfig() { return (await Beari.get("/ai/config")).data.data as { enabled: boolean; greeting: string }; }
export async function suggestVisitorContactMessages(subject: string, signal?: AbortSignal): Promise<string[]> { return (await Beari.post("/ai/visitor/contact-suggestions", { subject }, { signal })).data.data.suggestions as string[]; }
export async function saveAssistantSettings(data: AssistantSettings) { return (await Beari.put("/ai/admin/assistant/settings", data)).data.data as AssistantSettings; }
export type AdminAssistantImage = { path: string; url: string };
export function adminAssistantImageUrl(path: string) {
  return `/api/ai/admin/assistant/image?path=${encodeURIComponent(path)}`;
}
export async function uploadAdminAssistantImage(file: File): Promise<AdminAssistantImage> {
  return (await Beari.post("/ai/admin/assistant/image", file, {
    headers: { "Content-Type": file.type },
  })).data.data;
}
export async function sendAdminAssistantMessage(
  message: string,
  context?: string,
  image?: File,
  imagePath?: string,
  onImageStored?: (image: AdminAssistantImage) => void,
) {
  let storedImage = imagePath ? { path: imagePath, url: adminAssistantImageUrl(imagePath) } : undefined;
  try {
    if (image && !storedImage) {
      storedImage = await uploadAdminAssistantImage(image);
      onImageStored?.(storedImage);
    }
    const result = (await Beari.post("/ai/admin/assistant/chat", {
      message,
      ...(context ? { context } : {}),
      ...(storedImage ? { imagePath: storedImage.path } : {}),
    })).data.data as { answer: string };
    return { ...result, ...(storedImage ?? {}) };
  } catch (error) {
    if (storedImage && error && typeof error === "object") {
      Object.assign(error, storedImage);
    }
    throw error;
  }
}
export type CalendarTaskSuggestion = { title: string; details: string; location: string };
export async function suggestCalendarTask(input: { title: string; details: string; location: string; dueAt: string }): Promise<CalendarTaskSuggestion> { return (await Beari.post("/ai/admin/assistant/task-suggestion", input)).data.data as CalendarTaskSuggestion; }
export async function fetchAdminAssistantHistory() {
  const history = (await Beari.get("/ai/admin/assistant/chat")).data.data as Array<{ role: "user" | "assistant"; content: string; imagePath?: string }>;
  return history.map((item) => ({
    ...item,
    ...(item.imagePath ? { imagePreview: adminAssistantImageUrl(item.imagePath) } : {}),
  }));
}
export type ResumeSuggestionItem = { id: string; text: string; insert?: string };
export async function getResumeSuggestions(content: string) { return (await Beari.post("/ai/admin/assistant/resume-suggestions", { content })).data.data as { suggestions: string; items?: ResumeSuggestionItem[] }; }
export async function fetchAdminAnalytics(days = 30) { return (await Beari.get(`/admin/analytics?days=${days}`)).data.data; }
export async function fetchAdminSystem() { return (await Beari.get("/admin/system")).data.data; }
export type AdminAccount = { user_id: string; name: string; email: string; role: "admin" | "superAdmin"; created_at: string };
export async function fetchAdminAccounts(): Promise<AdminAccount[]> { return (await Beari.get("/admin/admins")).data.data; }
export async function inviteAdminAccount(input: { name: string; email: string; temporaryPassword: string }): Promise<AdminAccount> { return (await Beari.post("/admin/admins", input)).data.data; }
export async function updateAdminAccount(id: string, input: Pick<AdminAccount, "name" | "email" | "role">): Promise<AdminAccount> { return (await Beari.patch(`/admin/admins/${encodeURIComponent(id)}`, input)).data.data; }
export async function deleteAdminAccount(id: string): Promise<void> { await Beari.delete(`/admin/admins/${encodeURIComponent(id)}`); }
export type BlogSchedule = { enabled: boolean; timezone: string; postTimes: string[]; updatedAt: string };
export type BlogScheduleRun = { id: string; scheduled_for: string; status: "running" | "published" | "skipped" | "failed"; started_at: string; finished_at: string | null; post_slug: string | null; source_url: string | null; article_title: string | null; error_summary: string | null };
export async function fetchBlogSchedule() { return (await Beari.get("/admin/blog-schedule")).data.data as { schedule: BlogSchedule; runs: BlogScheduleRun[] }; }
export async function saveBlogSchedule(schedule: Pick<BlogSchedule, "enabled" | "timezone" | "postTimes">) { return (await Beari.put("/admin/blog-schedule", schedule)).data.data as BlogSchedule; }
export async function triggerBlogPublish() { return (await Beari.post("/admin/blog-schedule/run")).data as { success: boolean; message: string }; }
export type AdminNotificationCursor = { updatedAt: string; id: string };
export async function fetchAdminNotifications(cursor?: AdminNotificationCursor) {
  return (await Beari.get("/admin/notifications", {
    params: cursor ? { before: cursor.updatedAt, beforeId: cursor.id } : undefined,
  })).data.data;
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
  api: { ok: boolean; uptimeSeconds: number; nodeVersion: string };
  database: { ok: boolean; durationMs: number };
  redis: { ok: boolean; durationMs: number | null };
  memory: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number; externalBytes: number };
};
export type AdminStorageMetrics = {
  objects: number;
  bytes: number;
  buckets: { bucket: string; objects: number; bytes: number; lastObjectAt: string | null }[];
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
  timeline: { hour: string; requests: number; errors: number; warnings: number; averageDurationMs: number; pageViews: number }[];
  services: AdminApiServiceMetric[];
  endpoints: { method: string; path: string; requests: number; failures: number; averageDurationMs: number }[];
  statusGroups: Record<string, number>;
  health: AdminApiHealth;
  storage: AdminStorageMetrics | null;
  cloudflareStorage: AdminCloudflareStorageMetrics | null;
  access: AdminAccessMetrics;
  beari: { responses: number; failures: number; averageDurationMs: number };
};
export async function fetchAdminApiLogs(): Promise<AdminApiLog[]> { return (await Beari.get("/admin/logs")).data.data; }
export async function fetchAdminApiMetrics(): Promise<AdminApiMetrics> { return (await Beari.get("/admin/logs/metrics")).data.data; }
export async function markAdminNotificationRead(id: string) { await Beari.patch(`/admin/notifications/${encodeURIComponent(id)}/read`); }
export async function markAllAdminNotificationsRead() { await Beari.patch("/admin/notifications/read-all"); }
export type CalendarTask = { id: string; title: string; details: string; location: string; due_at: string; time_zone: string; reminder_at: string | null; reminder_email: string; reminder_sent_at: string | null; completed: boolean; created_at: string };
export async function fetchCalendarTasks(): Promise<CalendarTask[]> { return (await Beari.get("/admin/calendar/tasks")).data.data; }
export async function createCalendarTask(input: { title: string; details: string; location: string; due_at: string; time_zone: string; reminder_at: string | null }): Promise<CalendarTask> { return (await Beari.post("/admin/calendar/tasks", input)).data.data; }
export async function updateCalendarTask(id: string, completed: boolean): Promise<CalendarTask> { return (await Beari.patch(`/admin/calendar/tasks/${encodeURIComponent(id)}`, { completed })).data.data; }
export async function deleteCalendarTask(id: string) { await Beari.delete(`/admin/calendar/tasks/${encodeURIComponent(id)}`); }
export async function getBeariEmailStatus(): Promise<{ configured: boolean }> { return (await Beari.get("/admin/calendar/email-status")).data.data; }
export async function sendBeariEmail(input: { to: string; subject: string; message: string }) { return (await Beari.post("/admin/calendar/email", input)).data.data; }
export async function suggestMessageReply(input: { name: string; email: string; subject: string; body: string }): Promise<{ suggestion: string }> { return (await Beari.post("/ai/admin/assistant/message-reply-suggestion", input)).data.data; }
export type ProjectCodeSuggestion = { title: string; language: string; code: string };
export async function suggestProjectCode(input: { title: string; tech: string[]; problem: string; approach: string; results: string; existingTitles: string[] }): Promise<{ suggestions: ProjectCodeSuggestion[] }> { return (await Beari.post("/ai/admin/assistant/project-code-suggestions", input)).data.data; }
export type ContentSuggestionResource = "posts" | "services" | "projects";
export type ContentSuggestionField = "title" | "excerpt" | "content" | "description" | "summary";
export async function suggestAdminContentField(input: { resource: ContentSuggestionResource; field: ContentSuggestionField; value: string; context: Record<string, string> }, signal?: AbortSignal): Promise<{ suggestion: string }> {
  return (await Beari.post("/ai/admin/assistant/content-suggestions", input, { signal })).data.data;
}

async function list<T extends Row>(table: Table, admin = false): Promise<T[]> {
  if (table === "services") {
    const { data } = await servicesApi.get(admin ? "/admin" : "/");
    return data.data as T[];
  }
  const { data } = admin ? await Beari.get(`/admin/content/${table}`) : await Beari.get(`/content/${table}`);
  return data.data as T[];
}
async function upsert<T extends Row>(table: Table, row: Partial<T> & { id?: string }): Promise<T> {
  if (table === "projects" || table === "posts" || table === "services") {
    const reviewedFingerprint = (row as Partial<T> & { __translationSourceFingerprint?: string }).__translationSourceFingerprint;
    const fields = table === "projects"
      ? ["title", "tagline", "summary", "role", "problem", "approach", "results"]
      : table === "posts" ? ["title", "excerpt", "content"] : ["category", "subcategory", "title", "description", "screenshot_alt"];
    const english = Object.fromEntries(fields.filter((key) => typeof (row as Record<string, unknown>)[key] === "string" && String((row as Record<string, unknown>)[key]).trim()).map((key) => [key, (row as Record<string, unknown>)[key] as string]));
    if (table === "projects" && Array.isArray((row as Partial<Project>).metrics)) {
      (row as Partial<Project>).metrics!.forEach((metric, index) => { if (metric.label.trim()) english[`metricLabel${index}`] = metric.label; });
    }
    if (table === "projects" && Array.isArray((row as Partial<Project>).code_snippets)) {
      (row as Partial<Project>).code_snippets!.forEach((snippet, index) => { if (snippet.title.trim()) english[`snippetTitle${index}`] = snippet.title; });
    }
    const translationReviewed = reviewedFingerprint === JSON.stringify(english);
    const translated = { ...row } as Record<string, unknown>;
    for (const key of fields) if (!english[key]) for (const locale of LOCALES) translated[`${key}_${locale}`] = null;
    if (Object.keys(english).length && !translationReviewed) {
      const translations = await translateAdminFields(table, english);
      for (const locale of LOCALES) for (const [key, value] of Object.entries(translations[locale] ?? {})) {
        const metric = /^metricLabel(\d+)_(?:fr|zh|es|ar|pcm)$/.exec(key);
        const snippet = /^snippetTitle(\d+)_(?:fr|zh|es|ar|pcm)$/.exec(key);
        if (metric && Array.isArray(translated.metrics)) {
          const index = Number(metric[1]);
          translated.metrics = (translated.metrics as Project["metrics"]).map((item, i) => i === index ? { ...item, [`label_${locale}`]: value } : item);
        } else if (snippet && Array.isArray(translated.code_snippets)) {
          const index = Number(snippet[1]);
          translated.code_snippets = (translated.code_snippets as NonNullable<Project["code_snippets"]>).map((item, i) => i === index ? { ...item, [`title_${locale}`]: value } : item);
        } else translated[key] = value;
      }
    }
    if (table === "projects" && Array.isArray(translated.metrics)) translated.metrics = (translated.metrics as Project["metrics"]).map((item) => {
      const cleaned: Record<string, unknown> = { ...item };
      for (const locale of LOCALES) if (!item.label.trim()) cleaned[`label_${locale}`] = null;
      return cleaned;
    });
    delete translated.__translationSourceFingerprint;
    row = translated as Partial<T> & { id?: string };
  }
  if (table === "services") {
    const { id, ...payload } = row;
    const { data } = id ? await servicesApi.put(`/${id}`, payload) : await servicesApi.post("/", payload);
    return data.data as T;
  }
  if (table === "messages") {
    if (!row.id || typeof (row as Partial<Message>).is_read !== "boolean") throw new Error("Invalid message update.");
    const { data } = await Beari.patch(`/admin/messages/${encodeURIComponent(row.id)}`, { is_read: (row as Partial<Message>).is_read });
    return data.data as T;
  }
  if (row.id) {
    const { id, ...payload } = row;
    const { data } = await Beari.put(`/admin/content/${table}/${encodeURIComponent(id)}`, payload);
    return data.data as T;
  }
  const { data } = await Beari.post(`/admin/content/${table}`, row);
  return data.data as T;
}
async function remove(table: Table, id: string) {
  if (table === "services") { await servicesApi.delete(`/${encodeURIComponent(id)}`); return; }
  if (table === "messages") { await Beari.delete(`/admin/messages/${encodeURIComponent(id)}`); return; }
  await Beari.delete(`/admin/content/${table}/${encodeURIComponent(id)}`);
}
export async function sendMessage(message: NewMessage & { website?: string; turnstileToken: string }) { await Beari.post("/messages", message); }

export const useProjects = () => useQuery({ queryKey: ["projects"], queryFn: () => list<Project>("projects") });
export const usePosts = () => useQuery({ queryKey: ["posts"], queryFn: () => list<Post>("posts") });
export const useSkills = () => useQuery({ queryKey: ["skills"], queryFn: () => list<Skill>("skills"), initialData: SKILL_SEED, initialDataUpdatedAt: 0 });
export const useServices = () => useQuery({ queryKey: ["services"], queryFn: () => list<Service>("services") });
export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: sendMessage, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }) });
};
export const useAdminList = <T extends Row>(table: Table) => useQuery({ queryKey: ["admin", table], queryFn: () => list<T>(table, true) });
export const useAdminSave = <T extends Row>(table: Table) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (row: Partial<T> & { id?: string }) => upsert<T>(table, row), onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", table] }); void qc.invalidateQueries({ queryKey: [table] }); } });
};
export const useAdminDelete = (table: Table) => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => remove(table, id), onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", table] }); void qc.invalidateQueries({ queryKey: [table] }); } });
};
