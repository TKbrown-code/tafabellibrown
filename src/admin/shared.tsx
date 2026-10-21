import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Trash2, X } from "lucide-react";
import { completeAdminInvite, getAdminSession, loginAdmin, logoutAdmin, requestAdminMagicLink, useAdminDelete, useAdminSave } from "@/lib/api";
import { Logo } from "@/components/shared/ui";
import { turnstileErrorMessage } from "@/components/shared/TurnstileWidget";

type TurnstileApi = { render: (container: HTMLElement, options: { sitekey: string; theme: "auto"; callback: (token: string) => void; "expired-callback": () => void; "error-callback": (errorCode: string | number) => void }) => string; remove: (widgetId: string) => void; reset: (widgetId: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

export type Tab = "overview" | "calendar" | "messages" | "api-logs" | "projects" | "posts" | "blog-schedule" | "skills" | "services" | "settings" | "resume" | "beari-chat" | "beari-settings" | "admins" | "profile";

/* ------------------------------- Auth -------------------------------- */
export function useAuth() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const access = params.get("access_token");
        const refresh = params.get("refresh_token");
        const invite = access && refresh ? await completeAdminInvite(access, refresh) : await getAdminSession();
        if (access && refresh) window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
        if (active) setUser(invite.user);
      } catch { if (active) setUser(null); }
      finally { if (active) setReady(true); }
    };
    void restore();
    return () => { active = false; };
  }, []);
  const signIn = async (email: string, password: string, turnstileToken: string) => {
    const result = await loginAdmin(email, password, turnstileToken);
    setUser(result.user);
  };
  const requestSignInLink = (email: string, turnstileToken: string) =>
    requestAdminMagicLink(email, turnstileToken);
  const signOut = async () => { await logoutAdmin(); setUser(null); };
  return { ready, user, signIn, requestSignInLink, signOut };
}

export function Login({ onSignIn, onRequestSignInLink }: { onSignIn: (e: string, p: string, turnstileToken: string) => Promise<void>; onRequestSignInLink: (email: string, turnstileToken: string) => Promise<{ message: string }> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? "1x00000000000000000000AA" : "");
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!siteKey || !captchaRef.current) return;
    let active = true;
    const render = () => {
      if (!active || !captchaRef.current || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(captchaRef.current, {
        sitekey: siteKey,
        theme: "auto",
        callback: (token) => { setCaptchaToken(token); setErr(""); setCaptchaReady(true); },
        "expired-callback": () => { setCaptchaToken(""); setCaptchaReady(false); },
        "error-callback": (errorCode) => { setCaptchaToken(""); setCaptchaReady(false); setErr(turnstileErrorMessage(errorCode)); },
      });
    };
    if (window.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]');
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }
    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [siteKey]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    setNotice("");
    if (!siteKey) { setErr("Sign-in verification is not configured. Set the Cloudflare Turnstile site key for this deployment."); return; }
    if (!captchaToken) { setErr("Please complete the “I’m not a robot” check before signing in."); return; }
    if (!password) { setErr("Enter your password or request a one-time sign-in link."); return; }
    setBusy(true);
    try { await onSignIn(email, password, captchaToken); } catch (x) { const apiError = x as { message?: string; response?: { data?: { message?: string } } }; setErr(apiError.response?.data?.message || apiError.message || "Sign-in failed. Please try again."); setCaptchaToken(""); setCaptchaReady(false); if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current); } finally { setBusy(false); }
  };
  const sendSignInLink = async () => {
    setErr("");
    setNotice("");
    if (!emailInput.current?.reportValidity()) return;
    if (!siteKey) { setErr("Sign-in verification is not configured for this deployment."); return; }
    if (!captchaToken) { setErr("Complete the robot check before requesting a sign-in link."); return; }

    setBusy(true);
    try {
      const result = await onRequestSignInLink(email, captchaToken);
      setNotice(result.message);
      setCaptchaToken("");
      setCaptchaReady(false);
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    } catch (x) {
      const apiError = x as { message?: string; response?: { data?: { message?: string } } };
      setErr(apiError.response?.data?.message || apiError.message || "Could not request a sign-in link. Please try again.");
      setCaptchaToken("");
      setCaptchaReady(false);
      if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/.14),transparent_52%),hsl(var(--bg))] px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-[1.75rem] border border-border/80 bg-surface/95 p-7 shadow-lift backdrop-blur-xl sm:p-9" data-testid="form-login">
        <div className="mb-8 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/20 bg-accent-soft"><Logo className="h-7 w-7" /></span><div><p className="font-display text-lg font-bold tracking-tight">Tafa Belli Brown</p><p className="text-xs text-muted">Private workspace</p></div></div>
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">Secure access</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to continue to your workspace.</p>
        <div className="mt-7 space-y-4">
          <div><label className="label" htmlFor="a-email">Email address</label><input ref={emailInput} id="a-email" type="email" autoComplete="username" className="input h-12" value={email} onChange={(e) => setEmail(e.target.value)} required data-testid="input-admin-email" /></div>
          <div><label className="label" htmlFor="a-pass">Password</label><input id="a-pass" type="password" autoComplete="current-password" className="input h-12" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-admin-password" /></div>
        </div>
        <div className="mt-5 min-h-[66px]" aria-label="Robot verification">{siteKey ? <div ref={captchaRef} /> : <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">Robot verification is not configured for this deployment.</p>}</div>
        {err && <p className="mt-2 text-sm text-danger" role="alert">{err}</p>}
        {notice && <p className="mt-2 text-sm text-success" role="status">{notice}</p>}
        <button className="btn-primary mt-5 h-12 w-full" disabled={busy || !siteKey || !captchaToken || !captchaReady} data-testid="button-admin-login">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Continue securely</button>
        <button type="button" onClick={() => void sendSignInLink()} disabled={busy || !siteKey || !captchaToken || !captchaReady} className="mt-3 w-full text-center text-sm font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50">
          Email me a one-time sign-in link
        </button>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4"><Link to="/" className="flex items-center gap-1 text-xs text-muted hover:text-ink"><ArrowLeft className="h-3 w-3" /> Back to site</Link><span className="text-[10px] text-faint">Protected workspace</span></div>
      </form>
    </div>
  );
}

/* ----------------------------- Primitives ---------------------------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[11px] text-faint">{hint}</p>}
    </div>
  );
}

type Setter<T> = <K extends keyof T>(k: K, v: T[K]) => void;

export function Bi<T extends Record<string, unknown>>({ obj, set, k, label, area, rows = 4, onInput }: { obj: T; set: Setter<T>; k: keyof T & string; label: string; area?: boolean; rows?: number; onInput?: (value: string) => void }) {
  const C = area ? "textarea" : "input";
  return (
    <div>
      <Field label={`${label} · English`}>
        <C className="input" rows={area ? rows : undefined} value={(obj[k] as string) ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => { set(k, e.target.value as T[typeof k]); onInput?.(e.target.value); }} data-testid={`input-${k}`} />
      </Field>
      <p className="mt-1 text-[11px] text-faint">Beari translates this when you save.</p>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-border"}`}>
        <span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      {label}
    </label>
  );
}

export function Drawer({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside role="dialog" aria-label={title} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-border bg-bg shadow-lift" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-sans text-base font-bold">{title}</h2>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-2" aria-label="Close" data-testid="button-close-drawer"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">{children}</div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDelete({ onConfirm, testId, pending = false }: { onConfirm: () => void; testId: string; pending?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  return (
    <button type="button" disabled={pending} className={`btn-sm btn mr-auto ${armed ? "bg-danger text-white" : "btn-ghost text-danger"}`} onClick={() => (armed ? onConfirm() : setArmed(true))} data-testid={testId}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} {pending ? "Deleting…" : armed ? "Click again to delete" : "Delete"}
    </button>
  );
}

export function useEditor<T extends { id: string }>(table: "projects" | "posts" | "services", blank: () => T) {
  const [draft, setDraft] = useState<T | null>(null);
  const save = useAdminSave<T>(table);
  const del = useAdminDelete(table);
  const set: Setter<T> = (k, v) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  return { draft, setDraft, set, save, del, create: () => setDraft(blank()) };
}

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
export const isNew = (id: string) => id.startsWith("new-");
export const stripNew = <T extends { id: string }>(d: T) => (isNew(d.id) ? { ...d, id: undefined } : d) as Partial<T> & { id?: string };

export function Panel({ title, desc, action, children }: { title: string; desc: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-sans text-xl font-bold">{title}</h1><p className="text-sm text-muted">{desc}</p></div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Table<T extends { id: string }>({ rows, render, loading, empty }: { rows: T[]; render: (r: T) => ReactNode; loading: boolean; empty: string }) {
  if (loading) return <div className="card h-48 animate-pulse" />;
  if (!rows.length) return <div className="card p-12 text-center text-sm text-muted">{empty}</div>;
  return <div className="card divide-y divide-border overflow-hidden">{rows.map(render)}</div>;
}

export function Status({ on }: { on: boolean }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${on ? "bg-success/10 text-success" : "bg-surface-2 text-muted"}`}>{on ? "Published" : "Draft"}</span>;
}
