import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { saveSiteSettings, uploadProfileImage } from "@/lib/api";
import { useModal } from "@/hooks/useModal";
import { defaultSiteSettings, useSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { TranslationReview, type TranslationResult } from "./ContentPanels";
import { Field, Panel } from "./shared";

export function SettingsPanel() {
  const qc = useQueryClient();
  const { showModal } = useModal();
  const { data: settings = defaultSiteSettings } = useSiteSettings();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [feedback, setFeedback] = useState<Record<string, { message: string; error?: boolean }>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [reviewedSections, setReviewedSections] = useState<Record<string, { fingerprint: string; translations: TranslationResult }>>({});
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => setDraft(settings), [settings]);
  const set = (key: keyof SiteSettings, value: string) => setDraft((s) => ({ ...s, [key]: value }));
  const field = (key: keyof SiteSettings, label: string, type = "text") => <Field label={label}><input className="input" type={type} value={String(draft[key] ?? "")} onChange={(e) => set(key, e.target.value)} /></Field>;
  const bilingual = (en: keyof SiteSettings, _zh: keyof SiteSettings, label: string, area = false) => <div><Field label={`${label} · English`}>{area ? <textarea className="input min-h-24" value={String(draft[en] ?? "")} onChange={(e) => set(en, e.target.value)} /> : <input className="input" value={String(draft[en] ?? "")} onChange={(e) => set(en, e.target.value)} />}</Field><p className="mt-1 text-[11px] text-faint">Beari translates this when you save.</p></div>;
  const saveSection = async (section: string, keys: (keyof SiteSettings)[]) => {
    const englishFields = Object.fromEntries(keys.filter((key) => String(key).endsWith("En") && typeof draft[key] === "string" && String(draft[key]).trim()).map((key) => [key, draft[key] as string]));
    const review = reviewedSections[section];
    if (Object.keys(englishFields).length && review?.fingerprint !== JSON.stringify(englishFields)) {
      setFeedback((current) => ({ ...current, [section]: { message: "Preview and confirm the translations before saving.", error: true } }));
      return;
    }
    setSavingSection(section);
    setFeedback((current) => ({ ...current, [section]: { message: "" } }));
    try {
      const payload = Object.fromEntries(keys.map((key) => [key, draft[key]]));
      const saved = await saveSiteSettings(payload, review?.translations);
      qc.setQueryData(["site-settings"], saved);
      setDraft((current) => ({ ...current, ...saved }));
      setFeedback((current) => ({ ...current, [section]: { message: "Saved successfully." } }));
    } catch (saveError) {
      setFeedback((current) => ({ ...current, [section]: { message: (saveError as Error).message || "Could not save these settings.", error: true } }));
    } finally {
      setSavingSection(null);
    }
  };
  const sectionSave = (section: string, keys: (keyof SiteSettings)[]) => {
    const fields = Object.fromEntries(keys.filter((key) => String(key).endsWith("En") && typeof draft[key] === "string" && String(draft[key]).trim()).map((key) => [key, draft[key] as string]));
    const fingerprint = JSON.stringify(fields);
    const needsReview = Object.keys(fields).length > 0;
    return <div className="mt-5 space-y-4 border-t border-border pt-4">{needsReview && <TranslationReview resource="settings" fields={fields} onConfirm={(translations, source) => { setReviewedSections((current) => ({ ...current, [section]: { fingerprint: source, translations } })); setFeedback((current) => ({ ...current, [section]: { message: "Translations reviewed. Save to publish these changes." } })); }} />}<div className="flex flex-wrap items-center justify-between gap-3"><p role={feedback[section]?.error ? "alert" : "status"} className={`text-xs ${feedback[section]?.error ? "text-danger" : "text-muted"}`}>{feedback[section]?.message || "Changes are saved separately for this section."}</p><button type="button" className="btn-primary btn-sm" disabled={Boolean(savingSection) || uploading || needsReview && reviewedSections[section]?.fingerprint !== fingerprint} onClick={() => void saveSection(section, keys)}><Save className="h-4 w-4" />{savingSection === section ? "Saving…" : `Save ${section.toLowerCase()}`}</button></div></div>;
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) { const message = "Choose a JPG, PNG, or WebP image up to 8 MB."; setUploadError(message); showModal({ type: "error", title: "Upload not accepted", description: message }); return; }
    setUploading(true); setUploadError("");
    try { const image = await uploadProfileImage(file); setDraft((s) => ({ ...s, ...image })); setFeedback((current) => ({ ...current, ["Profile and hero"]: { message: "Portrait uploaded. Save this section to publish it." } })); showModal({ type: "success", title: "Portrait uploaded", description: "The image is in storage. Save Profile and hero to publish it." }); }
    catch (e) { const message = (e as Error).message; setUploadError(message); showModal({ type: "error", title: "Upload failed", description: message }); }
    finally { setUploading(false); }
  };
  return <Panel title="Site settings" desc="Update each portfolio section independently. Preview and confirm translations before saving public copy.">
    <div className="space-y-5">
      <div className="card p-5"><h2 className="mb-4 font-semibold">Profile and hero</h2><div className="mb-5 flex flex-wrap items-center gap-4"><img src={draft.profileImageUrl || defaultSiteSettings.profileImageUrl} alt="Profile preview" className="h-20 w-20 rounded-2xl border border-border object-cover" /><Field label="Upload portrait · JPG, PNG, WebP up to 8 MB"><input type="file" accept="image/jpeg,image/png,image/webp" className="input max-w-md" disabled={uploading} onChange={(e) => void upload(e.target.files?.[0])} /></Field>{uploading && <span className="text-xs text-muted">Uploading…</span>}</div>{uploadError && <p role="alert" className="mb-3 text-sm text-danger">{uploadError}</p>}<div className="grid gap-4 lg:grid-cols-2">{field("name", "Name")}</div><div className="mt-4">{bilingual("roleEn", "roleZh", "Professional title")}</div><div className="mt-4">{bilingual("heroTitleEn", "heroTitleZh", "Hero heading")}</div><div className="mt-4">{bilingual("heroBodyEn", "heroBodyZh", "Hero introduction", true)}</div>{sectionSave("Profile and hero", ["name", "profileImagePath", "profileImageUrl", "roleEn", "roleZh", "heroTitleEn", "heroTitleZh", "heroBodyEn", "heroBodyZh"])}</div>
      <div className="card space-y-4 p-5"><h2 className="font-semibold">About</h2>{bilingual("aboutTitleEn", "aboutTitleZh", "Section heading")}{bilingual("aboutBody1En", "aboutBody1Zh", "First paragraph", true)}{bilingual("aboutBody2En", "aboutBody2Zh", "Second paragraph", true)}{sectionSave("About", ["aboutTitleEn", "aboutTitleZh", "aboutBody1En", "aboutBody1Zh", "aboutBody2En", "aboutBody2Zh"])}</div>
      <div className="card space-y-4 p-5"><h2 className="font-semibold">Contact</h2><div className="grid gap-4 lg:grid-cols-2">{field("email", "Contact email", "email")}{bilingual("contactTitleEn", "contactTitleZh", "Section heading")}</div>{bilingual("contactBodyEn", "contactBodyZh", "Contact introduction", true)}{sectionSave("Contact", ["email", "contactTitleEn", "contactTitleZh", "contactBodyEn", "contactBodyZh"])}</div>
      <div className="card space-y-4 p-5"><h2 className="font-semibold">Social links and location</h2><div className="grid gap-4 lg:grid-cols-3">{field("github", "GitHub URL", "url")}{field("linkedin", "LinkedIn URL", "url")}{field("website", "Other website", "url")}</div>{bilingual("locationEn", "locationZh", "Location")}{sectionSave("Social links and location", ["github", "linkedin", "website", "locationEn", "locationZh"])}</div>
      <div className="card space-y-4 p-5"><h2 className="font-semibold">Education</h2>{bilingual("educationDegreeEn", "educationDegreeZh", "Degree")}{bilingual("educationSchoolEn", "educationSchoolZh", "School")}{bilingual("educationPlaceEn", "educationPlaceZh", "Location")}{bilingual("educationPeriodEn", "educationPeriodZh", "Period")}{sectionSave("Education", ["educationDegreeEn", "educationDegreeZh", "educationSchoolEn", "educationSchoolZh", "educationPlaceEn", "educationPlaceZh", "educationPeriodEn", "educationPeriodZh"])}</div>
    </div>
  </Panel>;
}

