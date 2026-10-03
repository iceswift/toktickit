import { UserRole } from "./api.js";

/** A text-bearing role indicator shared by the shell and managed-user views. */
export function RoleBadge({ role, shell = false }: { role: UserRole; shell?: boolean }) {
  return <span className={`badge ${shell ? "text-bg-light" : "text-bg-success"}`} aria-label={`Role: ${role}`}>{role}</span>;
}
