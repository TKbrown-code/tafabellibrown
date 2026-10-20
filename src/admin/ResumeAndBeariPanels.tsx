import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Download, Loader2, Mic, MicOff, Save, Volume2, VolumeX } from "lucide-react";
import { BeariMascot, type BeariState } from "@/components/beari/BeariMascot";
import { AdminChat, type AdminChatMessage } from "@/admin/AdminChat";
import { ResumeStudio } from "@/admin/resume/ResumeStudio";
import { fetchAdminAssistantHistory, fetchAdminSiteSettings, getAssistantSettings, getResumeSuggestions, saveAssistantSettings, saveSiteSettings, sendAdminAssistantMessage, uploadContentThumbnail, uploadResumePdf, type AssistantSettings } from "@/lib/api";
import { useSiteSettings } from "@/lib/site-settings";
import { useModal } from "@/hooks/useModal";
import { Field, Panel, Toggle } from "./shared";

const defaultResume = `# Tafa Belli Brown\n\nFull-Stack Web Developer · Jinzhou, Liaoning, China · tafabilly73@gmail.com\n\n## Professional Summary\n\nWrite a concise summary of your strengths, focus, and the kind of work you want to do.\n\n## Experience\n\n### Role or project · Organization · Dates\n- Describe what you built, the tools you used, and the outcome.\n- Keep each bullet focused on one contribution.\n\n## Projects\n\n### Project name · Dates\n- Explain the problem, your contribution, and verified results.\n\n## Education\n\nB.Sc. Computer Science — Liaoning University of Technology (Expected June 2028)\n\n## Skills\n\nReact · TypeScript · Node.js · Express · PostgreSQL · Supabase · Redis`;

type ResumeContent = { content: string };
type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null; onend: (() => void) | null; start: () => void; stop: () => void;
};
type SpeechRecognitionWindow = Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };

function normalizeChatText(text: string) {
  return text.replace(/([\p{L}])([’'])\s+([\p{L}])/gu, "$1$2$3");
}

function adminChatErrorMessage(error: unknown) {
  const value = error as { response?: { data?: { message?: string } }; message?: string };
  return value.response?.data?.message || value.message || "Please try again.";
}

function chooseBeariVoice(voices: SpeechSynthesisVoice[], language: string) {
  const baseLanguage = language.split("-")[0].toLowerCase();
  const matching = voices.filter((voice) => voice.lang.toLowerCase() === language.toLowerCase());
  const candidates = matching.length ? matching : voices.filter((voice) => voice.lang.toLowerCase().startsWith(`${baseLanguage}-`));
  const naturalVoice = candidates.find((voice) => /natural|neural|premium|google|microsoft|samantha|ava|aria|jenny/i.test(voice.name));
  return naturalVoice ?? candidates.find((voice) => !voice.name.toLowerCase().includes("compact")) ?? candidates[0] ?? voices[0] ?? null;
}

function spokenText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " Code example omitted. ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function speechChunks(text: string, maxLength = 220) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:[”’"')\]]*)|[^.!?]+$/g) ?? [text];
  const chunks: string[] = [];
  let chunk = "";
  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) continue;
    if (chunk && chunk.length + part.length + 1 > maxLength) {
      chunks.push(chunk);
      chunk = part;
    } else {
      chunk = chunk ? `${chunk} ${part}` : part;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

export function AdminAssistantPanel({ adminName = "there", adminId = "" }: { adminName?: string; adminId?: string }) {
  const [items, setItems] = useState<AdminChatMessage[]>([]);
  const [voiceReply, setVoiceReply] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<{ id: string; text: string }>();
  const [voiceError, setVoiceError] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [mascotMood, setMascotMood] = useState<BeariState>("idle");
  const retryRequests = useRef(new Map<string, { message: string; context?: string; image?: File; imagePath?: string; imageUrl?: string; messageId: string; localPreviewUrl?: string }>());
  const previewUrls = useRef(new Set<string>());
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechRunRef = useRef(0);
  const history = useQuery({ queryKey: ["admin-assistant-history", adminId], queryFn: fetchAdminAssistantHistory, enabled: Boolean(adminId) });
  const assistantSettings = useQuery({ queryKey: ["assistant-settings", adminId], queryFn: getAssistantSettings, enabled: Boolean(adminId) });
  useEffect(() => {
    setItems([]);
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
    retryRequests.current.clear();
  }, [adminId]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoice = () => setVoice(chooseBeariVoice(window.speechSynthesis.getVoices(), "en-US"));
    updateVoice();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoice);
  }, []);
  useEffect(() => { if (history.data) setItems(history.data.map((item, index) => ({ ...item, id: `history-${index}-${item.role}`, content: normalizeChatText(item.content) }))); }, [history.data]);
  useEffect(() => () => {
    speechRunRef.current += 1;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  const speak = (answer: string) => {
    if (!("speechSynthesis" in window)) {
      setVoiceError("Voice playback is unavailable in this browser. Try a current version of Chrome, Edge, or Safari.");
      return;
    }
    const text = spokenText(answer);
    if (!text) { setVoiceError("There is no readable text in that reply."); return; }
    const chunks = speechChunks(text);
    const run = ++speechRunRef.current;
    let currentChunk = 0;
    const speakNext = () => {
      if (run !== speechRunRef.current) return;
      if (currentChunk >= chunks.length) { setSpeaking(false); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[currentChunk++]);
      utterance.lang = voice?.lang || "en-US";
      if (voice) utterance.voice = voice;
      utterance.rate = 0.93;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => { if (run === speechRunRef.current) { setSpeaking(true); setVoiceError(""); } };
      utterance.onend = () => { if (run === speechRunRef.current) { if (currentChunk < chunks.length) window.setTimeout(speakNext, 110); else setSpeaking(false); } };
      utterance.onerror = (event) => {
        if (run === speechRunRef.current) {
          setSpeaking(false);
          if (event.error !== "canceled" && event.error !== "interrupted") setVoiceError("Beari’s reply could not be played. Check your device’s sound settings and try again.");
        }
      };
      window.speechSynthesis.speak(utterance);
    };
    setVoiceError("");
    window.speechSynthesis.cancel();
    setSpeaking(true);
    speakNext();
    // Some Chromium builds leave a queued utterance paused after the voices list initializes.
    window.setTimeout(() => window.speechSynthesis.resume(), 250);
  };
  const send = useMutation({
    mutationFn: (input: { message: string; context?: string; image?: File; imagePath?: string; imageUrl?: string; messageId: string; localPreviewUrl?: string }) =>
      sendAdminAssistantMessage(input.message, input.context, input.image, input.imagePath, (stored) => {
        input.imagePath = stored.path;
        input.imageUrl = stored.url;
        setItems((old) => old.map((item) => item.id === input.messageId
          ? { ...item, imagePath: stored.path, imagePreview: stored.url }
          : item));
        if (input.localPreviewUrl) {
          previewUrls.current.delete(input.localPreviewUrl);
          window.setTimeout(() => URL.revokeObjectURL(input.localPreviewUrl!), 0);
          input.localPreviewUrl = undefined;
        }
      }),
    onSuccess: (data, input) => {
      if (data.path) input.imagePath = data.path;
      if (data.url) input.imageUrl = data.url;
      setItems((old) => old.map((item) => item.id === input.messageId
        ? { ...item, ...(data.path ? { imagePath: data.path } : {}), ...(data.url ? { imagePreview: data.url } : {}) }
        : item));
      if (input.localPreviewUrl) {
        previewUrls.current.delete(input.localPreviewUrl);
        URL.revokeObjectURL(input.localPreviewUrl);
      }
      setItems((old) => [...old, { id: `reply-${Date.now()}`, role: "assistant", content: normalizeChatText(data.answer) }]);
      if (voiceReply) speak(data.answer);
      else { setMascotMood("happy"); window.setTimeout(() => setMascotMood("idle"), 1400); }
    },
    onError: (error, input) => {
      const id = `error-${crypto.randomUUID()}`;
      const stored = error && typeof error === "object"
        ? error as { path?: string; url?: string }
        : {};
      const request = {
        ...input,
        ...(stored.path ? { imagePath: stored.path } : {}),
        ...(stored.url ? { imageUrl: stored.url } : {}),
        ...(stored.path ? { image: undefined } : {}),
      };
      if (stored.path && stored.url) {
        setItems((old) => old.map((item) => item.id === input.messageId
          ? { ...item, imagePath: stored.path, imagePreview: stored.url }
          : item));
        if (input.localPreviewUrl) {
          previewUrls.current.delete(input.localPreviewUrl);
          URL.revokeObjectURL(input.localPreviewUrl);
        }
      }
      retryRequests.current.clear();
      retryRequests.current.set(id, request);
      setItems((old) => [...old.map((item) => item.retryable ? { ...item, retryable: false } : item), { id, role: "assistant", content: `I couldn't respond: ${adminChatErrorMessage(error)}`, retryable: true }]);
    },
  });
  const handleSend = (raw: string, context?: string, image?: File) => {
    const text = raw.trim();
    if ((!text && !image) || send.isPending) return;
    const imagePreview = image ? URL.createObjectURL(image) : undefined;
    if (imagePreview) previewUrls.current.add(imagePreview);
    const messageId = `message-${crypto.randomUUID()}`;
    setItems((old) => [...old, { id: messageId, role: "user", content: text, ...(imagePreview ? { imagePreview } : {}) }]);
    send.mutate({ message: text, messageId, ...(context ? { context } : {}), ...(image ? { image, localPreviewUrl: imagePreview } : {}) });
  };
  const retry = (messageId: string) => {
    const request = retryRequests.current.get(messageId);
    if (!request || send.isPending) return;
    retryRequests.current.delete(messageId);
    setItems((old) => old.filter((item) => item.id !== messageId));
    send.mutate(request);
  };
  const toggleMic = () => {
    setVoiceError("");
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const Ctor = (window as SpeechRecognitionWindow).SpeechRecognition || (window as SpeechRecognitionWindow).webkitSpeechRecognition;
    if (!Ctor) { setVoiceError("Voice input needs a supported browser. Try Chrome or Edge, or type to Beari."); return; }
    const recognition = new Ctor(); recognition.lang = navigator.language || "en-US"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setVoiceError(""); };
    recognition.onresult = (event) => { const transcript = Array.from(event.results).filter((result) => result[0]?.isFinal !== false).map((result) => result[0]?.transcript ?? "").join(" ").trim(); if (transcript) setVoiceTranscript({ id: crypto.randomUUID(), text: transcript }); };
    recognition.onerror = (event) => { setVoiceError(event.error === "not-allowed" || event.error === "service-not-allowed" ? "Microphone access is blocked. Allow microphone access for this site, then try again." : event.error === "no-speech" ? "No speech detected. Tap the microphone and try again." : event.error === "network" ? "Speech recognition could not connect. Check your internet connection and try again." : "Voice input stopped. Check your microphone and try again."); setListening(false); };
    recognition.onend = () => { recognitionRef.current = null; setListening(false); };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { recognitionRef.current = null; setListening(false); setVoiceError("Could not start voice input. Check microphone permission and try again."); }
  };
  const toggleVoiceReply = () => {
    setVoiceError("");
    if (voiceReply) { speechRunRef.current += 1; window.speechSynthesis?.cancel(); setSpeaking(false); }
    else if (!("speechSynthesis" in window)) { setVoiceError("Voice playback is unavailable in this browser."); return; }
    setVoiceReply((value) => !value);
  };
  const beariState: BeariState = listening ? "listening" : send.isPending ? "thinking" : speaking ? "speaking" : mascotMood;
  const savedGreeting = assistantSettings.data?.admin.greeting?.trim();
  const defaultGreeting = "Hi Boss, how are you doing today?";
  const personalizedGreeting = savedGreeting?.replace(/\b(?:Tafa(?: Belli Brown)?|Boss)\b/gi, adminName);
  const repeatsHeadline = personalizedGreeting?.trim().replace(/[.!?]+$/, "").toLowerCase() === "hi boss, how are you doing today";
  const welcomeMessage = personalizedGreeting && personalizedGreeting !== defaultGreeting && !repeatsHeadline
    ? personalizedGreeting
    : "I’m Beari, your private assistant. Pick a suggestion below or ask me anything about your portfolio.";
  return <AdminChat
    messages={items}
    sending={send.isPending}
    onSend={(text, image) => handleSend(text, undefined, image)}
    onRetry={retry}
    title="Beari"
    subtitle={voiceError || "Private admin assistant · unlimited messages"}
    headerIcon={<BeariMascot state={beariState} size={44} animate title="Beari, AI assistant" />}
    messageAvatar={<span className="mb-1 shrink-0"><BeariMascot state="idle" size={30} animate={false} title="" /></span>}
    welcomeIcon={<BeariMascot state="welcome" size={112} animate title="Beari" />}
    welcomeTitle={`Hi ${adminName}, how are you doing today?`}
    welcomeMessage={history.isLoading ? undefined : welcomeMessage}
    suggestions={["Summarize my portfolio content", "Review a project for improvements", "Suggest a blog post idea", "Improve a service description"]}
    onSuggestion={(suggestion) => handleSend(suggestion)}
    onSpeak={speak}
    voiceTranscript={voiceTranscript}
    composerActions={<>
      <button type="button" onClick={toggleMic} aria-label={listening ? "Stop voice input" : "Start voice input"} title={voiceError || (listening ? "Stop voice input" : "Voice input")} className={`grid h-11 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${listening ? "animate-pulse text-danger" : ""}`}>
        {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>
      <button type="button" onClick={toggleVoiceReply} aria-pressed={voiceReply} aria-label={voiceReply ? "Turn voice replies off" : "Turn voice replies on"} title={voiceReply ? "Turn voice replies off" : "Turn voice replies on"} className={`grid h-11 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${voiceReply ? "text-accent" : ""}`}>
        {voiceReply ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      </button>
    </>}
  />;
}

function uploadErrorMessage(error: unknown) {
  const value = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return value.response?.data?.message || value.response?.data?.error || value.message || "Upload failed. Please try again.";
}

export function ResumePanel() {
  const qc = useQueryClient();
  const { showModal } = useModal();
  const settings = useSiteSettings();
  const adminSettings = useQuery({ queryKey: ["admin-site-settings"], queryFn: fetchAdminSiteSettings });
  const [content, setContent] = useState(defaultResume);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [error, setError] = useState("");
  const latestContent = useRef(content);
  const hasLoaded = useRef(false);
  useEffect(() => {
    const stored = adminSettings.data?.resumeContent as ResumeContent | undefined;
    if (stored?.content) { setContent(stored.content); hasLoaded.current = true; }
    else if (adminSettings.data && !hasLoaded.current) {
      const old = stored as unknown as Record<string, string> | undefined;
      if (old?.name) setContent(`# ${old.name}\n\n${old.headline || ""} · ${old.location || ""} · ${old.email || ""}\n\n## Professional Summary\n\n${old.summary || ""}\n\n## Experience\n\n${old.experience || ""}\n\n## Education\n\n${old.education || ""}\n\n## Skills\n\n${old.skills || ""}`);
      hasLoaded.current = true;
    }
  }, [adminSettings.data]);
  const save = useMutation({ mutationFn: () => saveSiteSettings({ resumeContent: { content } }), onSuccess: () => { setSaved(true); void qc.invalidateQueries({ queryKey: ["admin-site-settings"] }); setTimeout(() => setSaved(false), 2500); } });
  const upload = async (file?: File) => { if (!file) return; if (file.type !== "application/pdf" || file.size > 12 * 1024 * 1024) { const message = "Choose a PDF up to 12 MB."; setError(message); showModal({ type: "error", title: "Upload not accepted", description: message }); return; } setUploading(true); setError(""); try { const asset = await uploadResumePdf(file); await saveSiteSettings({ resumePath: asset.resumePath, resumeUrl: asset.resumeUrl }); await qc.invalidateQueries({ queryKey: ["site-settings"] }); showModal({ type: "success", title: "Résumé uploaded", description: "Your PDF is saved in storage and ready to publish." }); } catch (e) { const message = uploadErrorMessage(e); setError(message); showModal({ type: "error", title: "Upload failed", description: message }); } finally { setUploading(false); } };
  const uploadThumbnail = async (file?: File) => { if (!file) return; if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) { const message = "Choose a JPG, PNG, or WebP image up to 8 MB."; setError(message); showModal({ type: "error", title: "Upload not accepted", description: message }); return; } setThumbnailBusy(true); setError(""); try { const image = await uploadContentThumbnail(file, "resume"); await saveSiteSettings({ resumeThumbnailPath: image.path, resumeThumbnailUrl: image.url }); await qc.invalidateQueries({ queryKey: ["site-settings"] }); showModal({ type: "success", title: "Résumé thumbnail uploaded", description: "The image is saved in storage and attached to your résumé." }); } catch (e) { const message = uploadErrorMessage(e); setError(message); showModal({ type: "error", title: "Upload failed", description: message }); } finally { setThumbnailBusy(false); } };
  const review = async (draft: string) => {
    const result = await getResumeSuggestions(draft);
    return result.items ?? [{ id: `review-${Date.now()}`, text: result.suggestions }];
  };
  const ask = async (question: string, draft: string) => (await sendAdminAssistantMessage(question, draft.slice(0, 12000))).answer;
  return <Panel title="Résumé studio" desc="Edit with formatted tools, ask Beari for feedback, then preview or save your résumé.">
    {preview ? <section className="card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="font-semibold">Résumé preview</h2><div className="flex gap-2"><button className="btn-ghost btn-sm" onClick={() => setPreview(false)}>Continue editing</button><button className="btn-primary btn-sm" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save draft</button><button className="btn-ghost btn-sm" onClick={() => window.print()}><Download className="h-4 w-4" /> Save as PDF</button></div></header>
      <div id="resume-print" className="resume-sheet max-w-none bg-surface px-7 py-9 text-ink md:px-12 md:py-12">{previewHtml ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>}<div className="mt-8 border-t border-border pt-3 text-xs text-muted">Résumé preview · {new Date().toLocaleDateString()}</div></div>
    </section> : <ResumeStudio value={content} onChange={(markdown) => { latestContent.current = markdown; setContent(markdown); setSaved(false); }} onSave={() => save.mutate()} onPreview={(html) => { setPreviewHtml(html); setPreview(true); }} saving={save.isPending} review={review} ask={ask} />}
    <p className="mt-3 text-xs text-muted">{content.length.toLocaleString()} characters · {content.trim().split(/\s+/).filter(Boolean).length} words{saved ? " · Draft saved" : ""}</p>
    {save.isError && <p role="alert" className="mt-2 text-sm text-danger">{(save.error as Error).message}</p>}
    <section className="card mt-5 space-y-3 p-4"><h2 className="text-sm font-semibold">Publish files</h2><p className="text-xs text-muted">The public CV button links to the uploaded PDF.</p><input type="file" accept="application/pdf,.pdf" className="input text-xs" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} />{uploading && <p className="text-xs text-muted">Uploading PDF…</p>}{settings.data?.resumeUrl && <a href={settings.data.resumeUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><Download className="h-4 w-4" /> View current PDF</a>}<div className="border-t border-border pt-3"><label className="label">Résumé thumbnail · Storage</label><input type="file" accept="image/jpeg,image/png,image/webp" className="input text-xs" disabled={thumbnailBusy} onChange={(event) => void uploadThumbnail(event.target.files?.[0])} />{thumbnailBusy && <p className="text-xs text-muted">Uploading thumbnail…</p>}{settings.data?.resumeThumbnailUrl && <img src={settings.data.resumeThumbnailUrl} alt="Résumé thumbnail" className="mt-2 h-20 w-full rounded-lg border border-border object-cover" />}</div>{error && <p role="alert" className="text-xs text-danger">{error}</p>}</section>
    <style>{`@media print { body * { visibility: hidden !important; } #resume-print, #resume-print * { visibility: visible !important; } #resume-print { position: absolute; inset: 0; width: 100%; border: 0 !important; box-shadow: none !important; } }`}</style>
  </Panel>;
}

const assistantDefaults: AssistantSettings = {
  visitor: { enabled: true, personality: "Warm, clear, and practical", instructions: "Help visitors learn about Tafa's work. Answer only from verified portfolio facts.", greeting: "Hi, I’m Beari. How can I help?", systemPrompt: "" },
  admin: { personality: "Warm, clear, practical, and candid", instructions: "Help me manage the portfolio, write useful content, and think through technical ideas. Separate suggestions from verified facts.", greeting: "Hi Boss, how are you doing today?" },
};

function normalizeAssistantSettings(value?: Partial<AssistantSettings> | null): AssistantSettings {
  return {
    visitor: {
      ...assistantDefaults.visitor,
      ...(value?.visitor ?? {}),
      enabled: value?.visitor?.enabled !== false,
      personality: value?.visitor?.personality?.trim() || assistantDefaults.visitor.personality,
      instructions: value?.visitor?.instructions ?? assistantDefaults.visitor.instructions,
      greeting: value?.visitor?.greeting ?? assistantDefaults.visitor.greeting,
      systemPrompt: value?.visitor?.systemPrompt ?? assistantDefaults.visitor.systemPrompt,
    },
    admin: {
      ...assistantDefaults.admin,
      ...(value?.admin ?? {}),
      personality: value?.admin?.personality?.trim() || assistantDefaults.admin.personality,
      instructions: value?.admin?.instructions ?? assistantDefaults.admin.instructions,
      greeting: value?.admin?.greeting ?? assistantDefaults.admin.greeting,
    },
  };
}

export function BeariSettingsPanel({ adminId = "" }: { adminId?: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["assistant-settings", adminId], queryFn: getAssistantSettings, enabled: Boolean(adminId) });
  const [draft, setDraft] = useState<AssistantSettings>(assistantDefaults);
  const [profile, setProfile] = useState<"visitor" | "admin">("visitor");
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (data) setDraft(normalizeAssistantSettings(data)); }, [data]);
  const save = useMutation({ mutationFn: () => saveAssistantSettings(normalizeAssistantSettings(draft)), onSuccess: (value) => { setDraft(normalizeAssistantSettings(value)); setSaved(true); void qc.invalidateQueries({ queryKey: ["assistant-settings", adminId] }); setTimeout(() => setSaved(false), 2500); } });
  if (isLoading) return <Panel title="Beari settings" desc="Visitor behavior is shared across the site. Your admin profile is private to your account."><div className="card p-8 text-sm text-muted">Loading assistant settings…</div></Panel>;
  const current = draft[profile];
  const update = (key: "personality" | "instructions" | "greeting" | "systemPrompt", value: string) => setDraft((all) => ({ ...all, [profile]: { ...all[profile], [key]: value } }));
  return <Panel title="Beari settings" desc="Visitor behavior is shared across the site. Your admin profile and chat history are private to your account.">
    <div className="max-w-3xl"><div className="mb-4 flex w-fit rounded-xl border border-border bg-surface p-1">{(["visitor", "admin"] as const).map((key) => <button key={key} onClick={() => setProfile(key)} className={`rounded-lg px-4 py-2 text-sm ${profile === key ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"}`}>{key === "visitor" ? "Visitor assistant" : "Admin assistant"}</button>)}</div>
      <div className="card space-y-4 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{profile === "visitor" ? "Public portfolio assistant" : "Private admin assistant"}</h2><p className="mt-1 text-xs text-muted">{profile === "visitor" ? "These settings shape replies on the public portfolio." : "These settings and your chat history apply only to your signed-in admin account."}</p></div>{profile === "visitor" && <Toggle checked={draft.visitor.enabled} onChange={(enabled) => setDraft((all) => ({ ...all, visitor: { ...all.visitor, enabled } }))} label={draft.visitor.enabled ? "Visitor chat on" : "Visitor chat off"} />}</div>
        <Field label="Personality"><input className="input" value={current.personality ?? ""} onChange={(event) => update("personality", event.target.value)} maxLength={500} placeholder="Warm, direct, concise" /></Field>
        <Field label="Additional instructions"><textarea className="input admin-chat-input min-h-40 resize-none" value={current.instructions ?? ""} onChange={(event) => update("instructions", event.target.value)} maxLength={4000} placeholder="Describe how Beari should help…" /></Field>
        <Field label="Greeting"><textarea className="input min-h-20" value={current.greeting ?? ""} onChange={(event) => update("greeting", event.target.value)} maxLength={500} /></Field>
        {profile === "visitor" && <details className="rounded-xl border border-border bg-bg/50 p-4">
          <summary className="cursor-pointer text-sm font-medium">Advanced visitor system prompt</summary>
          <p className="mt-2 text-xs leading-relaxed text-muted">Edit the core prompt used for Beari’s public chat. Personality, additional instructions, published portfolio facts, and fixed accuracy and safety rules are added automatically when Beari replies.</p>
          <textarea className="input mt-3 min-h-[28rem] font-mono text-xs leading-relaxed" value={current.systemPrompt ?? ""} onChange={(event) => update("systemPrompt", event.target.value)} maxLength={20000} placeholder="Loading the default visitor prompt…" aria-label="Visitor assistant system prompt" />
          <p className="mt-1 text-right text-xs text-muted">{(current.systemPrompt ?? "").length.toLocaleString()} / 20,000</p>
        </details>}
        {isError && <p role="alert" className="text-sm text-danger">Could not load settings. Refresh and try again.</p>}{save.isError && <p role="alert" className="text-sm text-danger">{(save.error as Error).message}</p>}
        <button className="btn-primary btn-sm" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saved ? `${profile === "visitor" ? "Visitor" : "Admin"} settings saved` : `Save ${profile === "visitor" ? "visitor" : "admin"} profile`}</button>
      </div>
    </div>
  </Panel>;
}
