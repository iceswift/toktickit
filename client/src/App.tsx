import { useState } from "react";
import { Category, checkSystem } from "./api.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  async function handleCheck() {
    setState("loading");
    setCategories([]);

    try {
      const result = await checkSystem();
      setCategories(result.categories);
      setState("success");
    } catch {
      setCategories([]);
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading..." : "Check System"}
      </button>

      {state === "loading" && (
        <p className="mt-4 text-secondary" role="status">
          Checking system status and loading categories...
        </p>
      )}

      {state === "success" && (
        <section className="mt-4" aria-labelledby="category-heading">
          <div className="alert alert-success" role="status">
            <strong>System Status:</strong> Online
          </div>

          <h2 id="category-heading" className="h5 mt-4">IT Request Categories</h2>
          <ul className="list-group mt-3">
            {categories.map((category) => (
              <li className="list-group-item" key={category.id}>
                {category.name}
              </li>
            ))}
          </ul>
        </section>
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
