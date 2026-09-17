import { FormEvent, useState } from "react";
import { ApiError, changePassword } from "./api.js";

export function ChangePassword({ onComplete }: { onComplete?: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setComplete(false);
    if (newPassword !== confirmation) { setError("The new password and confirmation must match."); return; }
    setSubmitting(true);
    try { await changePassword(currentPassword, newPassword, confirmation); setComplete(true); onComplete?.(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "Password could not be changed."); }
    finally { setSubmitting(false); }
  }
  return <main className="container py-5" style={{ maxWidth: 520 }}><section className="card shadow-sm"><div className="card-body p-4">
    <h1 className="h3 text-success">Change password</h1><p className="text-secondary">Choose a new password before continuing.</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {complete && <div className="alert alert-success" role="status">Password changed. Please sign in again.</div>}
    <form onSubmit={submit} noValidate>
      <label className="form-label fw-semibold" htmlFor="current-password">Current password</label><input className="form-control" id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
      <label className="form-label fw-semibold mt-3" htmlFor="new-password">New password</label><input className="form-control" id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /><p className="form-text">12–128 characters with uppercase, lowercase, number, and symbol.</p>
      <label className="form-label fw-semibold" htmlFor="confirm-password">Confirm new password</label><input className="form-control" id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
      <button className="btn btn-success mt-4" disabled={submitting} type="submit">{submitting ? "Saving..." : "Change password"}</button>
    </form>
  </div></section></main>;
}
