const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface HealthStatus {
  status: "ok";
  service: "TokTickIT API";
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(`${API_URL}/api/health`);

  if (!response.ok) {
    throw new Error("The TokTickIT API health check failed.");
  }

  const data = (await response.json()) as Partial<HealthStatus>;
  if (data.status !== "ok" || data.service !== "TokTickIT API") {
    throw new Error("The TokTickIT API returned an invalid health response.");
  }

  return data as HealthStatus;
}

export async function checkSystem(): Promise<SystemStatus> {
  await checkHealth();

  const response = await fetch(`${API_URL}/api/categories`);
  if (!response.ok) {
    throw new Error("The TokTickIT category request failed.");
  }

  const data = (await response.json()) as unknown;
  if (
    !Array.isArray(data) ||
    !data.every(
      (category) =>
        typeof category === "object" &&
        category !== null &&
        typeof category.id === "number" &&
        typeof category.name === "string",
    )
  ) {
    throw new Error("The TokTickIT API returned invalid category data.");
  }

  return { online: true, categories: data as Category[] };
}
