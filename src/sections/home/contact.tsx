import { useState } from "react";
import { Check, Copy, Mail, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSendMessage } from "@/lib/api";
import { site } from "@/data/site";
import { Reveal } from "@/components/shared/ui";
import { Socials } from "@/components/shared/Layout";
import { useModal } from "@/hooks/useModal";

export function Contact() {
  const { t } = useI18n();
  const send = useSendMessage();
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const { showModal } = useModal();

  console.log(send);

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
    send.mutate(form, {
      onSuccess: () => {
        setForm({ name: "", email: "", subject: "", body: "" });
        showModal({
          type: "success",
          title: "Message sent successfully!",
          description: t("f_sent"),
        });
      },
    });
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(site.email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value })),
    "aria-invalid": !!errors[k],
  });

  return (
    <section id="contact" className="section">
      <div className="container grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <p className="kicker">{t("contact_kicker")}</p>
          <h2 className="h-section">{t("contact_title")}</h2>
          <p className="mt-5 max-w-md text-muted">{t("contact_body")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`mailto:${site.email}`} className="btn-ghost" data-testid="link-email">
              <Mail className="h-4 w-4" /> {site.email}
            </a>
            <button onClick={copy} className="btn-ghost btn-sm" data-testid="button-copy-email" aria-label={t("copy_email")}>
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />} {copied ? t("copied") : t("copy_email")}
            </button>
          </div>
          <Socials className="mt-6" />
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={submit} noValidate className="card space-y-4 p-6 md:p-8" data-testid="form-contact">
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
            <div>
              <label className="label" htmlFor="c-subject">{t("f_subject")}</label>
              <input id="c-subject" className="input" {...field("subject")} data-testid="input-subject" />
            </div>
            <div>
              <label className="label" htmlFor="c-body">{t("f_message")} *</label>
              <textarea id="c-body" rows={5} className="input resize-y" {...field("body")} data-testid="input-message" />
              {errors.body && <p className="mt-1 text-xs text-danger">{errors.body}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button type="submit" className="btn-primary" disabled={send.isPending} data-testid="button-send">
                <Send className="h-4 w-4" /> {send.isPending ? t("f_sending") : t("f_send")}
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
