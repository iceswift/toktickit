const API_URL = import.meta.env.VITE_API_URL ?? (typeof window !== "undefined" && window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:3000" : "http://localhost:3000");

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export type RequestedPriority = "LOW" | "MEDIUM" | "HIGH";
export type TicketStatus = "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED" | "CLOSED" | "REOPENED" | "CANCELLED";
export type ITPriority = "NOT_SET" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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
  itPriority: ITPriority;
  currentStatus: TicketStatus;
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
  currentStatus?: TicketStatus;
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

export interface StaffQueueItem extends TicketListItem {
  requesterUser: { id: number; name: string } | null;
  owner: { id: number; name: string; role: UserRole } | null;
}
export interface StaffTicketDetail extends TicketDetail {
  requesterUser: { id: number; name: string; email: string } | null;
  owner: { id: number; name: string; role: UserRole } | null;
  publicComments: TicketEntry[];
  internalNotes: TicketEntry[];
}
export interface TicketOwner { id: number; name: string; role: UserRole; }
export interface TicketEntry { id: number; ticketId: number; content: string; createdAt: string; author: { id: number; name: string; role: UserRole }; }
export interface StaffQueueQuery {
  search?: string; status?: TicketStatus; requestedPriority?: RequestedPriority; itPriority?: ITPriority;
  sortBy?: "updatedAt" | "createdAt" | "ticketNumber" | "currentStatus" | "requestedPriority" | "itPriority";
  sortOrder?: "asc" | "desc"; page?: number; pageSize?: 10 | 20 | 50;
}

export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
}
export interface ManagedUser { id: number; name: string; email: string; role: UserRole; isActive: boolean; mustChangePassword: boolean; }
export async function getAdminUsers(search = "", role = ""): Promise<ManagedUser[]> { const p = new URLSearchParams(); if (search) p.set("search", search); if (role) p.set("role", role); const r = await fetch(`${API_URL}/admin/users?${p}`, { credentials: "include" }); const d = await r.json().catch(() => ({})); if (!r.ok || !Array.isArray(d)) throw new ApiError((d as { error?: string }).error ?? "Unable to retrieve users."); return d as ManagedUser[]; }
export async function createAdminUser(input: { name: string; email: string; role: UserRole; active: boolean; initialPassword: string }): Promise<ManagedUser> { const r = await fetch(`${API_URL}/admin/users`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new ApiError((d as { error?: string }).error ?? "Unable to create user."); return d as ManagedUser; }
export async function updateAdminUser(id:number,input:{name:string;email:string;role:UserRole;active:boolean}):Promise<ManagedUser>{const r=await fetch(`${API_URL}/admin/users/${id}`,{method:"PATCH",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new ApiError((d as {error?:string}).error??"Unable to update user.");return d as ManagedUser;}
export async function resetAdminPassword(id:number,initialPassword:string):Promise<void>{const r=await fetch(`${API_URL}/admin/users/${id}/initial-password`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({initialPassword})});if(!r.ok){const d=await r.json().catch(()=>({}));throw new ApiError((d as {error?:string}).error??"Unable to reset password.");}}

async function readAuthResponse(response: Response): Promise<AuthUser> {
  const data = await response.json().catch(() => ({})) as { error?: string; user?: AuthUser };
  if (!response.ok || !data.user) throw new ApiError(data.error ?? "Authentication could not be completed.");
  return data.user;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return readAuthResponse(response);
}

export async function getCurrentUser(): Promise<AuthUser> {
  return readAuthResponse(await fetch(`${API_URL}/auth/me`, { credentials: "include" }));
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  if (!response.ok) throw new ApiError("Logout could not be completed.");
}

export async function changePassword(currentPassword: string, newPassword: string, confirmation: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify({ currentPassword, newPassword, confirmation }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(data.error ?? "Password could not be changed.");
  }
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

export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  const response = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({})) as { error?: string; fields?: Record<string, string> } & Partial<Ticket>;
  if (!response.ok) throw new ApiError(data.error ?? "Unable to create the Ticket.", data.fields ?? {});
  if (typeof data.id !== "number" || typeof data.ticketNumber !== "string" || typeof data.requesterId !== "number") {
    throw new Error("The TokTickIT API returned an invalid Ticket.");
  }
  return data as Ticket;
}

export async function getMyTickets(query: MyTicketsQuery): Promise<TicketListResult> {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") parameters.set(key, String(value));
  }
  const response = await fetch(`${API_URL}/api/tickets?${parameters.toString()}`, { credentials: "include" });
  const data = await response.json().catch(() => ({})) as Partial<TicketListResult> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to retrieve Tickets.");
  if (!Array.isArray(data.items) || typeof data.page !== "number" || typeof data.pageSize !== "number" || typeof data.totalItems !== "number" || typeof data.totalPages !== "number") {
    throw new Error("The TokTickIT API returned an invalid Ticket list.");
  }
  return data as TicketListResult;
}

export async function getStaffTickets(query: StaffQueueQuery): Promise<TicketListResult & { items: StaffQueueItem[] }> {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== "") parameters.set(key, String(value));
  const response = await fetch(`${API_URL}/staff/tickets?${parameters.toString()}`, { credentials: "include" });
  const data = await response.json().catch(() => ({})) as Partial<TicketListResult> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to retrieve the Ticket queue.");
  if (!Array.isArray(data.items) || typeof data.page !== "number" || typeof data.pageSize !== "number" || typeof data.totalItems !== "number" || typeof data.totalPages !== "number") throw new Error("The TokTickIT API returned an invalid Ticket queue.");
  return data as TicketListResult & { items: StaffQueueItem[] };
}

async function staffTicketRequest(ticketId: number, path: string, method: string, body?: unknown): Promise<StaffTicketDetail | TicketEntry> {
  const response = await fetch(`${API_URL}/staff/tickets/${ticketId}${path}`, { method, credentials: "include", headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({})) as StaffTicketDetail | TicketEntry | { error?: string };
  if (!response.ok) throw new ApiError("error" in data && typeof data.error === "string" ? data.error : "Unable to update the Ticket.");
  return data as StaffTicketDetail | TicketEntry;
}

export async function getStaffTicketDetail(ticketId: number): Promise<StaffTicketDetail> {
  const response = await fetch(`${API_URL}/staff/tickets/${ticketId}`, { credentials: "include" });
  const data = await response.json().catch(() => ({})) as Partial<StaffTicketDetail> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to retrieve the Ticket.");
  if (typeof data.id !== "number" || !data.category || !data.relatedSystem || !Array.isArray(data.publicComments) || !Array.isArray(data.internalNotes)) throw new Error("The TokTickIT API returned an invalid staff Ticket detail.");
  return data as StaffTicketDetail;
}

export async function getStaffTicketOwners(): Promise<TicketOwner[]> {
  const response = await fetch(`${API_URL}/staff/ticket-owners`, { credentials: "include" });
  const data = await response.json().catch(() => ({})) as unknown;
  if (!response.ok || !Array.isArray(data)) throw new ApiError("Unable to retrieve active Ticket Owners.");
  return data as TicketOwner[];
}

export const claimStaffTicket = (ticketId: number) => staffTicketRequest(ticketId, "/owner", "PATCH", { ownerUserId: null }) as Promise<StaffTicketDetail>;
export const assignStaffTicket = (ticketId: number, ownerUserId: number) => staffTicketRequest(ticketId, "/owner", "PATCH", { ownerUserId }) as Promise<StaffTicketDetail>;
export const setStaffTicketPriority = (ticketId: number, itPriority: ITPriority) => staffTicketRequest(ticketId, "/it-priority", "PATCH", { itPriority }) as Promise<StaffTicketDetail>;
export const setStaffTicketStatus = (ticketId: number, status: TicketStatus) => staffTicketRequest(ticketId, "/status", "PATCH", { status }) as Promise<StaffTicketDetail>;
export const addStaffPublicComment = (ticketId: number, content: string) => staffTicketRequest(ticketId, "/public-comments", "POST", { content }) as Promise<TicketEntry>;
export const addStaffInternalNote = (ticketId: number, content: string) => staffTicketRequest(ticketId, "/internal-notes", "POST", { content }) as Promise<TicketEntry>;

export async function getTicketDetail(ticketId: number): Promise<TicketDetail> {
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, { credentials: "include" });
  const data = await response.json().catch(() => ({})) as Partial<TicketDetail> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to retrieve the Ticket.");
  if (typeof data.id !== "number" || typeof data.ticketNumber !== "string" || !data.category || !data.relatedSystem || !Array.isArray(data.attachments)) {
    throw new Error("The TokTickIT API returned an invalid Ticket detail.");
  }
  return data as TicketDetail;
}

export async function uploadTicketAttachment(ticketId: number, file: File): Promise<AttachmentMetadata> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, { method: "POST", credentials: "include", body });
  const data = await response.json().catch(() => ({})) as Partial<AttachmentMetadata> & { error?: string };
  if (!response.ok) throw new ApiError(data.error ?? "Unable to upload the attachment.");
  if (typeof data.id !== "number" || typeof data.originalFilename !== "string") throw new Error("The TokTickIT API returned invalid attachment data.");
  return data as AttachmentMetadata;
}

export async function removeAttachment(attachmentId: number, reason: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}`, { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(data.error ?? "Unable to remove the attachment.");
  }
}

export async function downloadAttachment(attachmentId: number): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/download`, { credentials: "include" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { error?: string };
    throw new ApiError(data.error ?? "Attachment download is unavailable.");
  }
  return response.blob();
}
