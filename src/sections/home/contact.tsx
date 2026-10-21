import { useEffect, useRef, useState } from "react";
import { Check, Copy, Mail, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { suggestVisitorContactMessages, useSendMessage } from "@/lib/api";
import { pickSetting, useSiteSettings } from "@/lib/site-settings";
import { Reveal } from "@/components/shared/ui";
import { Socials } from "@/components/shared/Layout";
import { useModal } from "@/hooks/useModal";
import { TurnstileWidget, turnstileErrorMessage, turnstileSiteKey } from "@/components/shared/TurnstileWidget";

export function Contact() {
  const { t, lang } = useI18n();
  const { data: settings } = useSiteSettings();
  const send = useSendMessage();
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const [turnstileVersion, setTurnstileVersion] = useState(0);
  const suggestionRequest = useRef<AbortController | null>(null);
  const suggestionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showModal } = useModal();
  const contactTitle = settings.contactTitleEn?.trim()
    ? pickSetting(settings, "contactTitleEn", "contactTitleZh", lang)
    : t("contact_title");
  const contactBody = settings.contactBodyEn?.trim()
    ? pickSetting(settings, "contactBodyEn", "contactBodyZh", lang)
    : t("contact_body");
  const requestSuggestions = async (subject: string) => {
    const trimmedSubject = subject.trim();
    if (trimmedSubject.length < 3) {
      setSuggestions([]);
      setSuggestionError(lang === "zh" ? "请先输入至少 3 个字符的主题。" : "Enter a subject of at least 3 characters first.");
      return;
    }
    suggestionRequest.current?.abort();
    const controller = new AbortController();
    suggestionRequest.current = controller;
    setSuggesting(true);
    setSuggestions([]);
    setSuggestionOpen(true);
    setSuggestionError("");
    try {
      const result = await suggestVisitorContactMessages(trimmedSubject, controller.signal);
      if (!controller.signal.aborted) { setSuggestions(result); setSuggestionOpen(true); }
    } catch {
      if (!controller.signal.aborted) {
        setSuggestions([]);
        setSuggestionOpen(true);
        setSuggestionError(lang === "zh" ? "暂时无法获取建议，请稍后重试。" : "Beari couldn’t get suggestions just now. Please try again.");
      }
    } finally {
      if (!controller.signal.aborted) setSuggesting(false);
    }
  };

  useEffect(() => {
    const subject = form.subject.trim();
    suggestionRequest.current?.abort();
    if (suggestionTimer.current) clearTimeout(suggestionTimer.current);
    setSuggestions([]);
    setSuggestionOpen(false);
    setSuggestionError("");
    setSuggesting(false);
    if (subject.length < 3) {
      return;
    }
    suggestionTimer.current = setTimeout(() => { void requestSuggestions(subject); }, 700);
    return () => {
      if (suggestionTimer.current) clearTimeout(suggestionTimer.current);
      suggestionRequest.current?.abort();
    };
  }, [form.subject]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("f_required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("f_invalid_email");
    if (!form.body.trim()) e.body = t("f_required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    if (!turnstileSiteKey || !turnstileToken) {
      setTurnstileError(!turnstileSiteKey ? "Robot verification is not configured. Please contact the site owner." : "Complete the robot check before sending your message.");
      return;
    }
    send.mutate({ name: form.name, email: form.email, subject: form.subject, body: form.body, website: form.website, turnstileToken }, {
      onSuccess: () => {
        setForm({ name: "", email: "", subject: "", body: "", website: "" });
        setTurnstileToken("");
        setTurnstileError("");
        setTurnstileVersion((version) => version + 1);
        showModal({
          type: "success",
          title: t("message_sent_title"),
          description: t("f_sent"),
        });
      },
      onError: () => {
        setTurnstileToken("");
        setTurnstileVersion((version) => version + 1);
        showModal({
          type: "error",
          title: t("message_error_title"),
          description: t("f_error"),
        });
      }
    });
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(settings.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
    "aria-invalid": !!errors[k],
  });

  return (
    <section id="contact" className="section border-t border-border bg-surface/50">
      <div className="container grid min-w-0 gap-12 lg:grid-cols-[1fr_1.2fr]">
        <Reveal className="min-w-0">
          <p className="kicker">{t("contact_kicker")}</p>
          <h2 className="h-section">{contactTitle}</h2>
          <p className="mt-5 max-w-md text-muted">{contactBody}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`mailto:${settings.email}`} className="btn-ghost" data-testid="link-email">
              <Mail className="h-4 w-4" /> {settings.email}
            </a>
            <button onClick={copy} className="btn-ghost btn-sm" data-testid="button-copy-email" aria-label={t("copy_email")}>
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />} {copied ? t("copied") : t("copy_email")}
            </button>
          </div>
          <Socials className="mt-6" />
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <form onSubmit={submit} noValidate className="card min-w-0 space-y-4 p-4 sm:p-6 md:p-8" data-testid="form-contact">
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="c-website">Website</label>
              <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="c-name">{t("f_name")} *</label>
                <input id="c-name" className="input" autoComplete="name" {...field("name")} data-testid="input-name" />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="c-email">{t("f_email")} *</label>
                <input id="c-email" type="email" className="input" autoComplete="email" {...field("email")} data-testid="input-email" />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
              </div>
            </div>
            <div className="relative">
              <label className="label" htmlFor="c-subject">{t("f_subject")}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="c-subject" className="input min-w-0 flex-1" {...field("subject")} data-testid="input-subject" />
                <button type="button" className="btn-ghost btn-sm shrink-0 self-start" aria-expanded={suggestionOpen} aria-controls="contact-message-suggestions" disabled={suggesting || form.subject.trim().length < 3} onClick={() => { if (suggestionTimer.current) clearTimeout(suggestionTimer.current); void requestSuggestions(form.subject); }} data-testid="button-suggest-message">
                  <Sparkles className="h-4 w-4" /> {suggesting ? (lang === "zh" ? "Beari 正在思考…" : "Beari is thinking…") : (lang === "zh" ? "获取建议" : "Suggest a message")}
                </button>
              </div>
              <p className="mt-1 text-xs text-muted">{lang === "zh" ? "输入主题后，Beari 会自动根据访客助手设置生成留言建议。" : "Beari will suggest message wording based on your subject."}</p>
              {suggestionOpen && (suggesting || suggestions.length > 0 || suggestionError) && <div id="contact-message-suggestions" className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-border bg-bg/95 p-3 shadow-2xl backdrop-blur-xl" role="region" aria-label={lang === "zh" ? "Beari 的留言建议" : "Beari message suggestions"}>
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink"><Sparkles className="h-3.5 w-3.5 text-accent" />{lang === "zh" ? "Beari 的建议" : "Beari’s suggestions"}</div>
                  <button type="button" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink" aria-label={lang === "zh" ? "关闭建议" : "Close suggestions"} onClick={() => setSuggestionOpen(false)}><X className="h-4 w-4" /></button>
                </div>
                {suggesting && <p className="px-1 py-2 text-xs text-muted" role="status">{lang === "zh" ? "正在根据主题撰写建议…" : "Drafting ideas from your subject…"}</p>}
                {suggestionError && <p className="px-1 py-2 text-xs text-muted" role="status">{suggestionError}</p>}
                {suggestions.length > 0 && <div className="space-y-1.5">
                  {suggestions.map((suggestion, index) => (
                    <button key={`${index}-${suggestion}`} type="button" className="flex w-full items-start gap-2.5 rounded-xl border border-transparent bg-surface/80 px-3 py-2.5 text-start text-xs leading-relaxed text-muted transition-colors hover:border-accent/30 hover:bg-surface-2 hover:text-ink" onClick={() => { setForm((current) => ({ ...current, body: suggestion })); setErrors((current) => ({ ...current, body: "" })); setSuggestionOpen(false); document.getElementById("c-body")?.focus(); }} data-testid="button-apply-message-suggestion">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/10 text-[10px] font-semibold text-accent">{index + 1}</span>
                      <span className="line-clamp-2">{suggestion}</span>
                    </button>
                  ))}
                </div>}
              </div>}
            </div>
            <div>
              <label className="label" htmlFor="c-body">{t("f_message")} *</label>
              <textarea id="c-body" rows={5} className="input resize-y" {...field("body")} data-testid="input-message" />
              {errors.body && <p className="mt-1 text-xs text-danger">{errors.body}</p>}
            </div>
            <div className="rounded-xl border border-border bg-surface/70 p-3 sm:p-4" role="group" aria-label="Robot verification and message submission">
              <p className="mb-2 flex items-center gap-2 text-xs font-medium text-muted"><ShieldCheck className="h-3.5 w-3.5 text-accent" />Complete this quick check to send your message</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-h-[66px] min-w-0 max-w-full">
                  {turnstileSiteKey ? <TurnstileWidget key={turnstileVersion} onVerify={(token) => { setTurnstileToken(token); setTurnstileError(""); }} onExpire={() => { setTurnstileToken(""); setTurnstileError("The robot check expired. Please complete it again."); }} onError={(errorCode) => { setTurnstileToken(""); setTurnstileError(turnstileErrorMessage(errorCode)); }} /> : <p className="py-2 text-xs text-danger">Robot verification is not configured for this site.</p>}
                </div>
                <button type="submit" className="btn-primary shrink-0 sm:ms-auto" disabled={send.isPending || !turnstileSiteKey || !turnstileToken} data-testid="button-send">
                  <Send className="h-4 w-4" /> {send.isPending ? t("f_sending") : t("f_send")}
                </button>
              </div>
              {turnstileError && <p className="mt-2 text-xs text-danger" role="alert">{turnstileError}</p>}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
