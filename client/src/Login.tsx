import { FormEvent, useState } from "react";
import { ApiError, AuthUser, Category, checkSystem, login } from "./api.js";

export function Login({ onAuthenticated }: { onAuthenticated?: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [systemState, setSystemState] = useState<"idle" | "loading" | "online" | "offline">("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  async function inspectSystem() {
    setSystemState("loading");
    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setSystemState("online");
    } catch {
      setSystemState("offline");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const user = await login(email, password);
      onAuthenticated?.(user);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Authentication could not be completed.");
    } finally { setSubmitting(false); }
  }

  return <main className="container py-5" style={{ maxWidth: 480 }}>
    <section className="card shadow-sm"><div className="card-body p-4">
      <h1 className="h3 text-success">TokTickIT</h1><h2 className="h4 mt-4">Sign in</h2>
      <p className="text-secondary">Use your assigned email address and password.</p>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form onSubmit={submit} noValidate>
        <label className="form-label fw-semibold" htmlFor="login-email">Email</label>
        <input className="form-control" id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label className="form-label fw-semibold mt-3" htmlFor="login-password">Password</label>
        <input className="form-control" id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button className="btn btn-success mt-4" disabled={submitting} type="submit">{submitting ? "Signing in..." : "Sign in"}</button>
      </form>
    </div></section>
    <section className="card shadow-sm mt-4"><div className="card-body p-4">
      <h2 className="h5">System Status</h2>
      <button className="btn btn-outline-success" type="button" onClick={() => void inspectSystem()}>Check System</button>
      {systemState === "loading" && <p role="status" className="mt-3">Checking system status and loading categories...</p>}
      {systemState === "online" && <div className="mt-3"><p>System Status: <strong>Online</strong></p><h3 className="h6">IT Request Categories</h3><ul>{categories.map((category) => <li key={category.id}>{category.name}</li>)}</ul></div>}
      {systemState === "offline" && <p role="alert" className="alert alert-danger mt-3">System Status: Offline. Unable to reach the TokTickIT API.</p>}
    </div></section>
  </main>;
}
