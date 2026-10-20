import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, KeyRound, Loader2, Save, ShieldCheck, UserRound } from "lucide-react";
import { changeCurrentAdminPassword, updateCurrentAdminName } from "@/lib/api";
import { Panel } from "./shared";

type AdminProfile = { user_id: string; name: string; email: string; role: string };

function errorMessage(error: unknown) {
  const apiError = error as { message?: string; response?: { data?: { message?: string } } };
  return apiError.response?.data?.message || apiError.message || "Could not save your changes. Please try again.";
}

export function ProfilePanel({ profile, onProfileUpdated }: { profile: AdminProfile | undefined; onProfileUpdated: (profile: AdminProfile) => void }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameStatus, setNameStatus] = useState("");
  const [nameError, setNameError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => { setName(profile?.name ?? ""); }, [profile?.name]);

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    setNameBusy(true); setNameStatus(""); setNameError("");
    try {
      const updated = await updateCurrentAdminName(name);
      setName(updated.name);
      onProfileUpdated(updated);
      setNameStatus("Your name has been updated.");
    } catch (error) { setNameError(errorMessage(error)); }
    finally { setNameBusy(false); }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordStatus(""); setPasswordError("");
    if (newPassword !== confirmPassword) { setPasswordError("The new passwords do not match."); return; }
    if (newPassword.length < 8) { setPasswordError("Use at least 8 characters for your new password."); return; }
    setPasswordBusy(true);
    try {
      const result = await changeCurrentAdminPassword(currentPassword, newPassword);
      setPasswordStatus(result.message);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) { setPasswordError(errorMessage(error)); }
    finally { setPasswordBusy(false); }
  };

  const copyId = async () => {
    if (!profile?.user_id) return;
    setCopyError("");
    try { await navigator.clipboard.writeText(profile.user_id); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
    catch { setCopyError("Could not access the clipboard. You can select and copy the ID directly."); }
  };

  return <Panel title="My profile" desc="Manage your admin account details and sign-in password.">
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="card space-y-5 p-5" aria-labelledby="profile-details-title">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><UserRound className="h-5 w-5" /></span><div><h2 id="profile-details-title" className="font-semibold">Profile details</h2><p className="text-xs text-muted">Your email and account ID are fixed identifiers.</p></div></div>
        <form className="space-y-4" onSubmit={(event) => void saveName(event)}>
          <div><label className="label" htmlFor="admin-profile-name">Name</label><input id="admin-profile-name" className="input" value={name} onChange={(event) => setName(event.target.value)} required minLength={1} maxLength={120} autoComplete="name" /></div>
          <div><label className="label" htmlFor="admin-profile-email">Email</label><input id="admin-profile-email" className="input cursor-not-allowed opacity-75" value={profile?.email ?? ""} readOnly aria-readonly="true" /><p className="mt-1 text-[11px] text-faint">Email changes are disabled for admin accounts.</p></div>
          <div><span className="label">Admin ID</span><div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-xl border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs text-muted">{profile?.user_id ?? "Loading…"}</code><button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => void copyId()} disabled={!profile?.user_id} aria-label="Copy admin ID">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy"}</button></div>{copyError && <p role="status" className="mt-1 text-xs text-muted">{copyError}</p>}</div>
          {nameError && <p role="alert" className="text-sm text-danger">{nameError}</p>}{nameStatus && <p role="status" className="text-sm text-success">{nameStatus}</p>}
          <button type="submit" className="btn-primary btn-sm" disabled={nameBusy || !profile || name.trim() === profile.name}>{nameBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save name</button>
        </form>
      </section>

      <section className="card space-y-5 p-5" aria-labelledby="profile-password-title">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent"><KeyRound className="h-5 w-5" /></span><div><h2 id="profile-password-title" className="font-semibold">Change password</h2><p className="text-xs text-muted">Confirm your current password before setting a new one.</p></div></div>
        <form className="space-y-4" onSubmit={(event) => void savePassword(event)}>
          <div><label className="label" htmlFor="admin-current-password">Current password</label><input id="admin-current-password" className="input" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" /></div>
          <div><label className="label" htmlFor="admin-new-password">New password</label><input id="admin-new-password" className="input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} maxLength={256} autoComplete="new-password" /><p className="mt-1 text-[11px] text-faint">Use at least 8 characters.</p></div>
          <div><label className="label" htmlFor="admin-confirm-password">Confirm new password</label><input id="admin-confirm-password" className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} maxLength={256} autoComplete="new-password" /></div>
          {passwordError && <p role="alert" className="text-sm text-danger">{passwordError}</p>}{passwordStatus && <p role="status" className="text-sm text-success">{passwordStatus}</p>}
          <button type="submit" className="btn-primary btn-sm" disabled={passwordBusy}>{passwordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Update password</button>
        </form>
      </section>
    </div>
  </Panel>;
}
