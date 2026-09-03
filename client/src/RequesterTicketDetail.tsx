import { useEffect, useState, type FormEvent } from "react";
import { AttachmentMetadata, DevelopmentRequester, downloadAttachment, getTicketDetail, removeAttachment, TicketDetail, uploadTicketAttachment } from "./api.js";

function label(value: string) { return value.charAt(0) + value.slice(1).toLowerCase().replace("_", " "); }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }

export function RequesterTicketDetail({ requester, ticketId, onBack }: { requester: DevelopmentRequester; ticketId: number; onBack: () => void }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [refreshKey, setRefreshKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [attachmentError, setAttachmentError] = useState("");
  const [removing, setRemoving] = useState<AttachmentMetadata | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  useEffect(() => {
    let active = true;
    setState("loading");
    void getTicketDetail(requester.id, ticketId).then((loaded) => { if (active) { setTicket(loaded); setState("ready"); } }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [requester.id, ticketId, refreshKey]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) { setAttachmentError("Choose a JPG, PNG, WEBP, or PDF file first."); return; }
    setUploadState("busy"); setAttachmentError("");
    try { await uploadTicketAttachment(requester.id, ticketId, file); setFile(null); setUploadState("success"); setRefreshKey((key) => key + 1); }
    catch (error) { setUploadState("error"); setAttachmentError(error instanceof Error ? error.message : "Unable to upload the attachment."); }
  }

  async function handleDownload(attachment: AttachmentMetadata) {
    setAttachmentError("");
    try {
      const blob = await downloadAttachment(requester.id, attachment.id);
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = attachment.originalFilename; link.click(); URL.revokeObjectURL(url);
    } catch (error) { setAttachmentError(error instanceof Error ? error.message : "Attachment download is unavailable."); }
  }

  async function handleRemoval(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!removing) return;
    if (removalReason.trim().length < 5 || removalReason.trim().length > 250) { setAttachmentError("Removal reason must be 5 to 250 characters."); return; }
    setAttachmentError("");
    try { await removeAttachment(requester.id, removing.id, removalReason.trim()); setRemoving(null); setRemovalReason(""); setRefreshKey((key) => key + 1); }
    catch (error) { setAttachmentError(error instanceof Error ? error.message : "Unable to remove the attachment."); }
  }

  return <section aria-labelledby="ticket-detail-heading">
    <button className="btn btn-outline-success mb-4" onClick={onBack}>Back to My Tickets</button>
    {state === "loading" && <p role="status" className="text-secondary">Loading Ticket details...</p>}
    {state === "error" && <div className="alert alert-danger" role="alert">Ticket details are unavailable or you do not have access to this Ticket.</div>}
    {state === "ready" && ticket && <><div className="d-flex flex-wrap justify-content-between gap-3 mb-4"><div><h1 className="h3 mb-1" id="ticket-detail-heading">{ticket.ticketNumber}</h1><p className="text-secondary mb-0">Requester Ticket Detail — read-only in Lab 2.</p></div><div><span className="badge text-bg-success me-2">{label(ticket.currentStatus)}</span><span className="badge text-bg-secondary">Requested {label(ticket.requestedPriority)}</span></div></div>
      <section className="card shadow-sm" aria-label="Read-only Ticket information"><div className="card-body"><dl className="row mb-0"><dt className="col-sm-3">Requester</dt><dd className="col-sm-9">{requester.displayName}</dd><dt className="col-sm-3">Summary</dt><dd className="col-sm-9">{ticket.summary}</dd><dt className="col-sm-3">Category</dt><dd className="col-sm-9">{ticket.category.name}</dd><dt className="col-sm-3">Related System</dt><dd className="col-sm-9">{ticket.relatedSystem.name}</dd><dt className="col-sm-3">Requested Priority</dt><dd className="col-sm-9">{label(ticket.requestedPriority)}</dd><dt className="col-sm-3">IT Priority</dt><dd className="col-sm-9">{label(ticket.itPriority)}</dd><dt className="col-sm-3">Current Status</dt><dd className="col-sm-9">{label(ticket.currentStatus)}</dd><dt className="col-sm-3">Created</dt><dd className="col-sm-9">{formatDate(ticket.createdAt)}</dd><dt className="col-sm-3">Last Updated</dt><dd className="col-sm-9">{formatDate(ticket.updatedAt)}</dd><dt className="col-sm-3">Description</dt><dd className="col-sm-9" style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</dd></dl></div></section>
      <section className="card shadow-sm mt-4" aria-labelledby="attachments-heading"><div className="card-body"><h2 className="h5" id="attachments-heading">Attachments</h2>
        <form onSubmit={handleUpload} className="border rounded p-3 mb-3"><label className="form-label" htmlFor="attachment-file">Add attachment</label><input className="form-control" id="attachment-file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setUploadState("idle"); setAttachmentError(""); }} /><div className="form-text">JPG, PNG, WEBP, or PDF; up to 5 MB; maximum five active files.</div><button className="btn btn-success mt-3" disabled={!file || uploadState === "busy"}>{uploadState === "busy" ? "Uploading..." : "Upload attachment"}</button>{uploadState === "success" && <p className="text-success mb-0 mt-2" role="status">Attachment uploaded.</p>}</form>
        {attachmentError && <div className="alert alert-danger" role="alert">{attachmentError}</div>}
        {ticket.attachments.length === 0 ? <p className="mb-0 text-secondary">No attachments have been added.</p> : <ul className="list-group">{ticket.attachments.map((attachment) => <li className="list-group-item" key={attachment.id}><div className="d-flex flex-wrap justify-content-between gap-2"><div><strong>{attachment.originalFilename}</strong><div className="text-secondary small">{attachment.mimeType}, {attachment.byteSize} bytes, uploaded {formatDate(attachment.uploadedAt)}</div>{attachment.removedAt && <div className="text-danger small">Removed {formatDate(attachment.removedAt)}: {attachment.removalReason}</div>}</div>{attachment.removedAt ? <span className="badge text-bg-secondary align-self-start">Removed</span> : <div className="d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-success" onClick={() => void handleDownload(attachment)}>Download</button><button type="button" className="btn btn-sm btn-outline-danger" onClick={() => { setRemoving(attachment); setRemovalReason(""); setAttachmentError(""); }}>Remove</button></div>}</div></li>)}</ul>}
        {removing && <form onSubmit={handleRemoval} className="border border-danger rounded p-3 mt-3" aria-label="Confirm attachment removal"><h3 className="h6">Remove {removing.originalFilename}</h3><label className="form-label" htmlFor="removal-reason">Removal reason</label><textarea className="form-control" id="removal-reason" value={removalReason} onChange={(event) => setRemovalReason(event.target.value)} minLength={5} maxLength={250} required /><div className="form-text">5 to 250 characters. This action blocks future downloads.</div><button className="btn btn-danger mt-3">Confirm removal</button><button type="button" className="btn btn-link mt-3" onClick={() => setRemoving(null)}>Cancel</button></form>}
      </div></section></>}
  </section>;
}
