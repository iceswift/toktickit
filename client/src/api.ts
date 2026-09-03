const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface DevelopmentRequester {
  id: number;
  displayName: string;
  email: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export type RequestedPriority = "LOW" | "MEDIUM" | "HIGH";

export interface CreateTicketInput {
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  requestedPriority: RequestedPriority;
  description: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: RequestedPriority;
  itPriority: "NOT_SET";
  currentStatus: "NEW";
  createdAt: string;
  updatedAt: string;
}

export interface TicketListItem extends Ticket {
  category: Category;
}

export interface TicketListResult {
  items: TicketListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AttachmentMetadata {
  id: number;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  uploadedAt: string;
  removedAt: string | null;
  removalReason: string | null;
}

export interface TicketDetail extends Ticket {
  category: Category;
  relatedSystem: RelatedSystem;
  attachments: AttachmentMetadata[];
}

export interface MyTicketsQuery {
  search?: string;
  categoryId?: number;
  requestedPriority?: RequestedPriority;
  currentStatus?: "NEW";
  sortBy?: "createdAt" | "updatedAt" | "ticketNumber" | "requestedPriority";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: 10 | 20 | 50;
}

export class ApiError extends Error {
  constructor(message: string, public readonly fields: Record<string, string> = {}) {
    super(message);
  }
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

export async function getDevelopmentRequesters(): Promise<DevelopmentRequester[]> {
  const response = await fetch(`${API_URL}/api/development-requesters`);
  if (!response.ok) throw new Error("The TokTickIT development requester request failed.");

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !data.every(
    (requester) => typeof requester === "object" && requester !== null &&
      typeof requester.id === "number" && typeof requester.displayName === "string" &&
      typeof requester.email === "string",
  )) {
    throw new Error("The TokTickIT API returned invalid requester data.");
  }

  return data as DevelopmentRequester[];
}

async function getReferenceData(path: string, label: string): Promise<{ id: number; name: string }[]> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) throw new Error(`The TokTickIT ${label} request failed.`);
  const data = await response.json() as unknown;
  if (!Array.isArray(data) || !data.every((item) => typeof item === "object" && item !== null && typeof item.id === "number" && typeof item.name === "string")) {
    throw new Error(`The TokTickIT API returned invalid ${label} data.`);
  }
  return data as { id: number; name: string }[];
}

export async function getCategories(): Promise<Category[]> {
  return getReferenceData("/api/categories", "category") as Promise<Category[]>;
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  return getReferenceData("/api/related-systems", "related system") as Promise<RelatedSystem[]>;
}

export async function createTicket(requesterId: number, input: CreateTicketInput): Promise<Ticket> {
  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Development-Requester-Id": String(requesterId),
    },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({})) as { error?: string; fields?: Record<string, string> } & Partial<Ticket>;
  if (!response.ok) throw new ApiError(data.error ?? "Unable to create the Ticket.", data.fields ?? {});
  if (typeof data.id !== "number" || typeof data.ticketNumber !== "string" || typeof data.requesterId !== "number") {
    throw new Error("The TokTickIT API returned an invalid Ticket.");
  }
  return data as Ticket;
}

export async function getMyTickets(requesterId: number, query: MyTicketsQuery): Promise<TicketListResult> {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") parameters.set(key, String(value));
  }
  const response = await fetch(`${API_URL}/api/tickets?${parameters.toString()}`, {
    headers: { "X-Development-Requester-Id": String(requesterId) },
  });
  const data = await response.json().catch(() => ({})) as Partial<TicketListResult> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to retrieve Tickets.");
  if (!Array.isArray(data.items) || typeof data.page !== "number" || typeof data.pageSize !== "number" || typeof data.totalItems !== "number" || typeof data.totalPages !== "number") {
    throw new Error("The TokTickIT API returned an invalid Ticket list.");
  }
  return data as TicketListResult;
}

export async function getTicketDetail(requesterId: number, ticketId: number): Promise<TicketDetail> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, { headers: { "X-Development-Requester-Id": String(requesterId) } });
  const data = await response.json().catch(() => ({})) as Partial<TicketDetail> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to retrieve the Ticket.");
  if (typeof data.id !== "number" || typeof data.ticketNumber !== "string" || !data.category || !data.relatedSystem || !Array.isArray(data.attachments)) {
    throw new Error("The TokTickIT API returned an invalid Ticket detail.");
  }
  return data as TicketDetail;
}

export async function uploadTicketAttachment(requesterId: number, ticketId: number, file: File): Promise<AttachmentMetadata> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, { method: "POST", headers: { "X-Development-Requester-Id": String(requesterId) }, body });
  const data = await response.json().catch(() => ({})) as Partial<AttachmentMetadata> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to upload the attachment.");
  if (typeof data.id !== "number" || typeof data.originalFilename !== "string") throw new Error("The TokTickIT API returned invalid attachment data.");
  return data as AttachmentMetadata;
}

export async function removeAttachment(requesterId: number, attachmentId: number, reason: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}`, { method: "DELETE", headers: { "Content-Type": "application/json", "X-Development-Requester-Id": String(requesterId) }, body: JSON.stringify({ reason }) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(data.error ?? "Unable to remove the attachment.");
  }
}

export async function downloadAttachment(requesterId: number, attachmentId: number): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, { headers: { "X-Development-Requester-Id": String(requesterId) } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(data.error ?? "Attachment download is unavailable.");
  }
  return response.blob();
}
