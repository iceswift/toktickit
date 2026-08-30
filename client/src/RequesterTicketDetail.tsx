import { useEffect, useState } from "react";
import { DevelopmentRequester, getTicketDetail, TicketDetail } from "./api.js";

function label(value: string) { return value.charAt(0) + value.slice(1).toLowerCase().replace("_", " "); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function RequesterTicketDetail({ requester, ticketId, onBack }: { requester: DevelopmentRequester; ticketId: number; onBack: () => void }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let active = true;
    setState("loading");
    void getTicketDetail(requester.id, ticketId).then((loaded) => { if (active) { setTicket(loaded); setState("ready"); } }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [requester.id, ticketId]);

  return <section aria-labelledby="ticket-detail-heading">
    <button className="btn btn-outline-success mb-4" onClick={onBack}>Back to My Tickets</button>
    {state === "loading" && <p role="status" className="text-secondary">Loading Ticket details...</p>}
    {state === "error" && <div className="alert alert-danger" role="alert">Ticket details are unavailable or you do not have access to this Ticket.</div>}
    {state === "ready" && ticket && <><div className="d-flex flex-wrap justify-content-between gap-3 mb-4"><div><h1 className="h3 mb-1" id="ticket-detail-heading">{ticket.ticketNumber}</h1><p className="text-secondary mb-0">Requester Ticket Detail — read-only in Lab 2.</p></div><div><span className="badge text-bg-success me-2">{label(ticket.currentStatus)}</span><span className="badge text-bg-secondary">Requested {label(ticket.requestedPriority)}</span></div></div>
      <section className="card shadow-sm" aria-label="Read-only Ticket information"><div className="card-body"><dl className="row mb-0"><dt className="col-sm-3">Requester</dt><dd className="col-sm-9">{requester.displayName}</dd><dt className="col-sm-3">Summary</dt><dd className="col-sm-9">{ticket.summary}</dd><dt className="col-sm-3">Category</dt><dd className="col-sm-9">{ticket.category.name}</dd><dt className="col-sm-3">Related System</dt><dd className="col-sm-9">{ticket.relatedSystem.name}</dd><dt className="col-sm-3">Requested Priority</dt><dd className="col-sm-9">{label(ticket.requestedPriority)}</dd><dt className="col-sm-3">IT Priority</dt><dd className="col-sm-9">{label(ticket.itPriority)}</dd><dt className="col-sm-3">Current Status</dt><dd className="col-sm-9">{label(ticket.currentStatus)}</dd><dt className="col-sm-3">Created</dt><dd className="col-sm-9">{formatDate(ticket.createdAt)}</dd><dt className="col-sm-3">Last Updated</dt><dd className="col-sm-9">{formatDate(ticket.updatedAt)}</dd><dt className="col-sm-3">Description</dt><dd className="col-sm-9" style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</dd></dl></div></section>
      <section className="card shadow-sm mt-4"><div className="card-body"><h2 className="h5">Attachments</h2>{ticket.attachments.length === 0 ? <p className="mb-0 text-secondary">No attachments have been added. Attachment actions are introduced in Phase 6.</p> : <ul className="mb-0">{ticket.attachments.map((attachment) => <li key={attachment.id}>{attachment.originalFilename} <span className="text-secondary">({attachment.mimeType}, {attachment.byteSize} bytes, uploaded {formatDate(attachment.uploadedAt)})</span></li>)}</ul>}</div></section></>}
  </section>;
}
