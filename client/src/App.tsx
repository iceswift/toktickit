import { useState } from "react";
import { checkHealth } from "./api.js";

// Issue 2 introduces these health-check states. Issue 4 will extend the
// success state with the category list.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");

  async function handleCheck() {
    setState("loading");

    try {
      await checkHealth();
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "loading" && (
        <p className="mt-4 text-secondary" role="status">
          Checking system status...
        </p>
      )}

      {state === "success" && (
        <div className="alert alert-success mt-4" role="status">
          <strong>System Status:</strong> Online
        </div>
      )}

      {state === "error" && (
        <div className="alert alert-danger mt-4" role="alert">
          <p className="mb-1"><strong>System Status:</strong> Offline</p>
          <p className="mb-0">
            Unable to reach the TokTickIT API. Please make sure the backend is running and try again.
          </p>
        </div>
      )}
    </div>
  );
}
