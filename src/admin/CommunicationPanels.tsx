import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Bell, Bot, Eye, EyeOff, Inbox, MessageSquare, Send, Sparkles, Trash2, Users } from "lucide-react";
import { getBeariEmailStatus, sendBeariEmail, suggestMessageReply, useAdminDelete, useAdminList, useAdminSave } from "@/lib/api";
import type { Message } from "@/lib/types";
import { formatDate } from "@/components/shared/ui";
import { useModal } from "@/hooks/useModal";
import { Panel } from "./shared";

/* ------------------------------- Messages ---------------------------- */
export function MessagesPanel({ initialMessageId }: { initialMessageId?: string | null }) {
  const { showModal } = useModal();
  const { data, isLoading } = useAdminList<Message>("messages");
  const save = useAdminSave<Message>("messages");
  const del = useAdminDelete("messages");
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [replyNotice, setReplyNotice] = useState("");
  const [replyError, setReplyError] = useState("");
  const emailStatus = useQuery({ queryKey: ["beari-email-status"], queryFn: getBeariEmailStatus });
  useEffect(() => { if (initialMessageId) setOpenId(initialMessageId); }, [initialMessageId]);
  const open = data?.find((m) => m.id === openId) ?? data?.[0];
  useEffect(() => {
    setReplyTo(open?.email ?? "");
    setReplySubject(open ? `Re: ${open.subject || "Your message"}` : "");
    setReplyBody("");
    setReplyNotice("");
    setReplyError("");
  }, [open?.id]);

  const sendReply = useMutation({
    mutationFn: sendBeariEmail,
    onSuccess: () => { setReplyNotice("Email sent successfully."); setReplyError(""); setReplyBody(""); },
    onError: (error) => {
      const apiError = error as { message?: string; response?: { data?: { message?: string } } };
      setReplyError(apiError.response?.data?.message || apiError.message || "Could not send email.");
      setReplyNotice("");
    },
  });
  const suggestReply = useMutation({
    mutationFn: suggestMessageReply,
    onSuccess: (result) => { setReplyBody(result.suggestion); setReplyNotice("Beari drafted a reply for you to review."); setReplyError(""); },
    onError: (error) => {
      const apiError = error as { message?: string; response?: { data?: { message?: string } } };
      setReplyError(apiError.response?.data?.message || apiError.message || "Beari couldn’t suggest a reply. Try again.");
      setReplyNotice("");
    },
  });
  const submitReply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReplyError("");
    setReplyNotice("");
    sendReply.mutate({ to: replyTo.trim(), subject: replySubject.trim(), message: replyBody.trim() });
  };

  useEffect(() => {
    if (open && !open.is_read) save.mutate({ id: open.id, is_read: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open?.id]);

  return (
    <Panel title="Messages" desc="Read contact messages and reply from your connected email sender.">
      {!emailStatus.data?.configured && <div role="status" className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Email sending needs <code>RESEND_API_KEY</code> and <code>RESEND_FROM_EMAIL</code> configured in the backend.</div>}
      {emailStatus.isError && <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">Couldn’t check email configuration.</div>}
      <div className="card grid min-h-[620px] overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-border xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><h2 className="text-sm font-semibold">Inbox</h2><p className="text-xs text-muted">{data?.length ?? 0} message{data?.length === 1 ? "" : "s"}</p></div><Inbox className="h-4 w-4 text-accent" /></div>
          <ul className="max-h-64 divide-y divide-border overflow-y-auto xl:max-h-[720px]">
            {isLoading ? <li className="p-4 text-sm text-muted">Loading messages…</li> : data?.length ? data.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setOpenId(m.id)} className={`w-full border-l-2 px-4 py-3 text-left transition-colors ${open?.id === m.id ? "border-accent bg-accent-soft/70" : "border-transparent hover:bg-surface-2"}`} data-testid={`row-message-${m.id}`}>
                  <div className="flex items-center gap-2">{!m.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}<p className={`truncate text-sm ${m.is_read ? "font-medium" : "font-bold"}`}>{m.name}</p><span className="ml-auto shrink-0 font-mono text-[10px] text-faint">{formatDate(m.created_at, "en")}</span></div>
                  <p className="mt-1 truncate text-xs font-medium text-ink">{m.subject || "(no subject)"}</p><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{m.body}</p>
                </button>
              </li>
            )) : <li className="p-5 text-center"><Inbox className="mx-auto h-6 w-6 text-faint" /><p className="mt-2 text-sm font-medium">Inbox zero</p><p className="mt-1 text-xs text-muted">New contact messages will appear here.</p></li>}
          </ul>
        </aside>
        <div className="min-w-0">
          {open ? <div className="border-b border-border p-5 sm:p-6" data-testid="panel-message">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-wider text-accent">Contact message</p><h3 className="mt-1 break-words font-display text-xl font-bold">{open.subject || "(no subject)"}</h3><p className="mt-1 text-sm text-muted">From {open.name} · <a className="link" href={`mailto:${open.email}`}>{open.email}</a> · {formatDate(open.created_at, "en")}</p></div><div className="flex shrink-0 gap-2"><button type="button" disabled={save.isPending} className="btn-ghost btn-sm" onClick={() => save.mutate({ id: open.id, is_read: !open.is_read })}>{save.isPending ? <Activity className="h-3.5 w-3.5 animate-pulse" /> : open.is_read ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{save.isPending ? "Updating…" : open.is_read ? "Unread" : "Mark read"}</button><button type="button" disabled={del.isPending} className="btn-ghost btn-sm text-danger" onClick={() => del.mutate(open.id, { onSuccess: () => { setOpenId(null); showModal({ type: "success", title: "Message deleted", description: "The contact message was removed from your inbox." }); }, onError: (error) => showModal({ type: "error", title: "Could not delete message", description: (error as Error).message || "Please try again." }) })} aria-label="Delete message">{del.isPending ? <Activity className="h-3.5 w-3.5 animate-pulse" /> : <Trash2 className="h-3.5 w-3.5" />}{del.isPending && "Deleting…"}</button></div></div>
            <div className="mt-5 rounded-xl border border-border bg-surface-2/60 p-4"><p className="whitespace-pre-wrap text-sm leading-relaxed">{open.body}</p></div>
          </div> : <div className="grid min-h-40 place-items-center border-b border-border p-6 text-center text-sm text-muted">Select a message to see its details. You can also compose a new email below.</div>}
          <section className="p-5 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{open ? "Reply to message" : "Compose email"}</h3><p className="mt-1 text-xs text-muted">Use Beari to draft a reply, then review it before sending.</p></div><button type="button" className="btn-ghost btn-sm" disabled={!open || suggestReply.isPending} onClick={() => { setReplyError(""); setReplyNotice(""); if (open) suggestReply.mutate({ name: open.name, email: open.email, subject: open.subject || "", body: open.body }); }}><Sparkles className="h-4 w-4" />{suggestReply.isPending ? "Beari is drafting…" : "Suggest reply with Beari"}</button></div>
            {(replyNotice || replyError) && <p role={replyError ? "alert" : "status"} className={`mb-3 rounded-lg px-3 py-2 text-sm ${replyError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{replyError || replyNotice}</p>}
            <form onSubmit={submitReply} className="space-y-3"><div className="grid gap-3 md:grid-cols-2"><label className="block"><span className="label">To</span><input className="input" type="email" maxLength={254} required value={replyTo} onChange={(event) => setReplyTo(event.target.value)} placeholder="name@example.com" /></label><label className="block"><span className="label">Subject</span><input className="input" maxLength={200} required value={replySubject} onChange={(event) => setReplySubject(event.target.value)} placeholder="Email subject" /></label></div><label className="block"><span className="label">Message</span><textarea className="input min-h-36 resize-y" maxLength={10000} required value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder="Write your reply here, or ask Beari to draft one." /></label><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">Sent from your connected Beari email service.</p><button type="submit" className="btn-primary btn-sm" disabled={sendReply.isPending || !emailStatus.data?.configured}><Send className="h-4 w-4" />{sendReply.isPending ? "Sending…" : "Send email"}</button></div></form>
          </section>
        </div>
      </div>
    </Panel>
  );
}

export type AdminNotification = {
  id: string;
  category: "message" | "visitor" | "beari" | "system" | "content" | "calendar" | "admin" | "feedback";
  title: string;
  body: string;
  target_id: string | null;
  occurrence_count: number;
  created_at: string;
  updated_at: string;
  read_at: string | null;
};

export function NotificationsMenu({ notifications, unreadCount, isLive, hasError, onSelect, onMarkAll, markAllPending = false }: { notifications: AdminNotification[]; unreadCount: number; isLive: boolean; hasError: boolean; onSelect: (notification: AdminNotification) => void; onMarkAll: () => void; markAllPending?: boolean }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  const categoryIcon = (category: AdminNotification["category"]) => {
    if (category === "message") return <MessageSquare className="h-4 w-4" />;
    if (category === "visitor") return <Users className="h-4 w-4" />;
    if (category === "beari") return <Bot className="h-4 w-4" />;
    if (category === "feedback") return <Sparkles className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };
  return <div ref={menuRef} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications, ${unreadCount} unread`} title={unreadCount ? `${unreadCount} unread notifications` : "Notifications"} aria-expanded={open} aria-controls="admin-notifications-menu" data-testid="button-notifications" className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-ink">
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-ink">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </button>
    <AnimatePresence>
      {open && <motion.div id="admin-notifications-menu" role="dialog" aria-label="Notifications" initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-lift">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-sm font-semibold">Notifications</p><p className="flex items-center gap-1.5 text-xs text-muted"><span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-success" : "bg-amber-400"}`} />{isLive ? "Live updates on" : "Connecting…"}{unreadCount ? ` · ${unreadCount} unread` : " · You’re all caught up"}</p></div>{(unreadCount > 0 || markAllPending) && <button type="button" disabled={markAllPending} onClick={onMarkAll} className="text-[11px] font-medium text-accent hover:underline disabled:cursor-wait disabled:opacity-60">{markAllPending ? <><Activity className="mr-1 inline h-3 w-3 animate-pulse" />Updating…</> : "Mark all read"}</button>}</div>
        {notifications.length ? <div className="max-h-80 divide-y divide-border overflow-y-auto">{notifications.map((notification) => <button key={notification.id} type="button" onClick={() => { setOpen(false); onSelect(notification); }} className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2 ${notification.read_at ? "opacity-70" : "bg-accent-soft/30"}`}><span className="mt-0.5 shrink-0 text-accent">{categoryIcon(notification.category)}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{notification.title}</span><span className="shrink-0 font-mono text-[10px] text-faint">{formatDate(notification.updated_at, "en")}</span></span><span className="mt-1 block text-xs text-muted">{notification.body}{notification.occurrence_count > 1 ? ` · ${notification.occurrence_count} events` : ""}</span></span>{!notification.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}</button>)}</div> : <p className="px-4 py-6 text-center text-sm text-muted">{hasError ? "Notifications couldn’t load. Check your API connection and admin access." : "Messages, visitors, Beari, content, and calendar activity will appear here."}</p>}
        <button type="button" onClick={() => { setOpen(false); onSelect({ category: "message", id: "", target_id: null } as AdminNotification); }} className="w-full border-t border-border px-4 py-3 text-left text-xs font-medium text-accent hover:bg-surface-2">Open messages</button>
      </motion.div>}
    </AnimatePresence>
  </div>;
}
