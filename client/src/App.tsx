import { useEffect, useState } from "react";
import { Category, checkSystem, DevelopmentRequester, getDevelopmentRequesters } from "./api.js";

type LoadState = "loading" | "ready" | "error";
type SystemState = "idle" | "loading" | "success" | "error";
const STORAGE_KEY = "toktickit.developmentRequesterId";

function getStoredRequesterId(): number | null {
  const value = window.sessionStorage.getItem(STORAGE_KEY);
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export default function App() {
  const [state, setState] = useState<LoadState>("loading");
  const [requesters, setRequesters] = useState<DevelopmentRequester[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(getStoredRequesterId);
  const [isInApp, setIsInApp] = useState(false);
  const [systemState, setSystemState] = useState<SystemState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    async function loadRequesters() {
      setState("loading");
      try {
        const loaded = await getDevelopmentRequesters();
        if (!active) return;
        setRequesters(loaded);
        setSelectedId((current) => {
          if (current && loaded.some((requester) => requester.id === current)) return current;
          window.sessionStorage.removeItem(STORAGE_KEY);
          return null;
        });
        setState("ready");
      } catch {
        if (active) setState("error");
      }
    }
    void loadRequesters();
    return () => { active = false; };
  }, []);

  const selectedRequester = requesters.find((requester) => requester.id === selectedId) ?? null;

  function continueToApp() {
    if (!selectedRequester) return;
    window.sessionStorage.setItem(STORAGE_KEY, String(selectedRequester.id));
    setIsInApp(true);
  }

  function changeRequester() {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setSelectedId(null);
    setIsInApp(false);
  }

  async function handleCheck() {
    setSystemState("loading");
    setCategories([]);
    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setSystemState("success");
    } catch {
      setSystemState("error");
    }
  }

  if (!isInApp || !selectedRequester) {
    return (
      <main className="container py-5" style={{ maxWidth: 720 }}>
        <section className="card shadow-sm"><div className="card-body p-4">
          <h1 className="h3 text-success">TokTickIT</h1>
          <h2 className="h4 mt-4">Select Development Requester</h2>
          <p className="text-secondary">Choose a Development Requester to test requester-specific behavior. This is not a login screen.</p>
          {state === "loading" ? <p className="text-secondary">Loading development requesters...</p> : state === "error" ? <div className="alert alert-danger">Unable to load Development Requesters. Please try again after the API is available.</div> : requesters.length === 0 ? <div className="alert alert-warning" role="status">No active Development Requesters are available.</div> : <>
            <label className="form-label fw-semibold" htmlFor="development-requester">Development Requester</label>
            <select className="form-select" id="development-requester" value={selectedId ?? ""} onChange={(event) => setSelectedId(event.target.value ? Number(event.target.value) : null)}>
              <option value="">Choose a requester...</option>
              {requesters.map((requester) => <option key={requester.id} value={requester.id}>{requester.displayName}</option>)}
            </select>
            <p className="form-text">Only active Development Requesters are shown.</p>
            <button className="btn btn-success mt-3" disabled={!selectedRequester} onClick={continueToApp}>Continue</button>
          </>}
        </div></section>
        <section className="mt-4" aria-labelledby="system-check-heading">
          <h2 className="h5" id="system-check-heading">System check</h2>
          <button className="btn btn-success" disabled={systemState === "loading"} onClick={handleCheck}>{systemState === "loading" ? "Loading..." : "Check System"}</button>
          {systemState === "loading" && <p className="mt-3 text-secondary" role="status">Checking system status and loading categories...</p>}
          {systemState === "success" && <section className="mt-3" aria-labelledby="category-heading"><div className="alert alert-success" role="status"><strong>System Status:</strong> Online</div><h3 id="category-heading" className="h5">IT Request Categories</h3><ul className="list-group mt-3">{categories.map((category) => <li className="list-group-item" key={category.id}>{category.name}</li>)}</ul></section>}
          {systemState === "error" && <div className="alert alert-danger mt-3" role="alert"><p className="mb-1"><strong>System Status:</strong> Offline</p><p className="mb-0">Unable to reach the TokTickIT API. Please make sure the backend is running and try again.</p></div>}
        </section>
      </main>
    );
  }

  return (
    <main>
      <nav className="navbar navbar-dark bg-success px-3" aria-label="Application navigation">
        <span className="navbar-brand mb-0 h1">TokTickIT</span>
        <span className="text-white">Requester: {selectedRequester.displayName}</span>
        <button className="btn btn-outline-light btn-sm" onClick={changeRequester}>Change Requester</button>
      </nav>
      <section className="container py-5" style={{ maxWidth: 720 }}>
        <h1 className="h3">Requester context ready</h1>
        <p className="text-secondary">Create Ticket and My Tickets will be delivered in upcoming Lab 2 phases.</p>
      </section>
    </main>
  );
}
