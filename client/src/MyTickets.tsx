import { useEffect, useState } from "react";
import { Category, DevelopmentRequester, getCategories, getMyTickets, MyTicketsQuery, RequestedPriority, TicketListResult } from "./api.js";

const defaultQuery: Required<Pick<MyTicketsQuery, "sortBy" | "sortOrder" | "page" | "pageSize">> = {
  sortBy: "createdAt", sortOrder: "desc", page: 1, pageSize: 10,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function priorityLabel(priority: RequestedPriority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export function MyTickets({ requester, onCreateTicket }: { requester: DevelopmentRequester; onCreateTicket: () => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState<MyTicketsQuery>(defaultQuery);
  const [result, setResult] = useState<TicketListResult | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;
    void getCategories().then((loaded) => active && setCategories(loaded)).catch(() => active && setCategories([]));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setState("loading");
    void getMyTickets(requester.id, query)
      .then((loaded) => { if (active) { setResult(loaded); setState("ready"); } })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [requester.id, query]);

  function update<K extends keyof MyTicketsQuery>(key: K, value: MyTicketsQuery[K]) {
    setQuery((current) => ({ ...current, [key]: value, page: 1 }));
  }

  function clearFilters() { setQuery(defaultQuery); }
  const hasFilters = Boolean(query.search || query.categoryId || query.requestedPriority || query.currentStatus || query.sortBy !== "createdAt" || query.sortOrder !== "desc" || query.pageSize !== 10);
  const noResults = state === "ready" && result?.items.length === 0 && hasFilters;
  const empty = state === "ready" && result?.items.length === 0 && !hasFilters;

  return <section aria-labelledby="my-tickets-heading">
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div><h1 className="h3 mb-1" id="my-tickets-heading">My Tickets</h1><p className="text-secondary mb-0">Tickets submitted by {requester.displayName}.</p></div>
      <button className="btn btn-success" onClick={onCreateTicket}>Create Ticket</button>
    </div>
    <section className="card shadow-sm mb-4" aria-label="Ticket filters"><div className="card-body">
      <div className="row g-3">
        <div className="col-12 col-md-6"><label className="form-label" htmlFor="ticket-search">Search</label><input id="ticket-search" className="form-control" value={query.search ?? ""} onChange={(event) => update("search", event.target.value)} placeholder="Ticket Number or Summary" /></div>
        <div className="col-12 col-sm-6 col-md-3"><label className="form-label" htmlFor="ticket-category">Category</label><select id="ticket-category" className="form-select" value={query.categoryId ?? ""} onChange={(event) => update("categoryId", event.target.value ? Number(event.target.value) : undefined)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="col-12 col-sm-6 col-md-3"><label className="form-label" htmlFor="ticket-priority">Requested Priority</label><select id="ticket-priority" className="form-select" value={query.requestedPriority ?? ""} onChange={(event) => update("requestedPriority", event.target.value as RequestedPriority || undefined)}><option value="">All priorities</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></div>
        <div className="col-12 col-sm-6 col-md-3"><label className="form-label" htmlFor="ticket-status">Current Status</label><select id="ticket-status" className="form-select" value={query.currentStatus ?? ""} onChange={(event) => update("currentStatus", event.target.value as "NEW" || undefined)}><option value="">All statuses</option><option value="NEW">New</option></select></div>
        <div className="col-12 col-sm-6 col-md-3"><label className="form-label" htmlFor="ticket-sort">Sort by</label><select id="ticket-sort" className="form-select" value={query.sortBy} onChange={(event) => update("sortBy", event.target.value as Required<typeof defaultQuery>["sortBy"])}><option value="createdAt">Created date</option><option value="updatedAt">Last updated</option><option value="ticketNumber">Ticket Number</option><option value="requestedPriority">Requested Priority</option></select></div>
        <div className="col-12 col-sm-6 col-md-3"><label className="form-label" htmlFor="ticket-order">Order</label><select id="ticket-order" className="form-select" value={query.sortOrder} onChange={(event) => update("sortOrder", event.target.value as "asc" | "desc")}><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
        <div className="col-12 col-sm-6 col-md-3"><label className="form-label" htmlFor="ticket-page-size">Per page</label><select id="ticket-page-size" className="form-select" value={query.pageSize} onChange={(event) => update("pageSize", Number(event.target.value) as 10 | 20 | 50)}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></div>
        <div className="col-12 col-md-3 d-flex align-items-end"><button className="btn btn-outline-success w-100" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button></div>
      </div>
    </div></section>
    {state === "loading" && <p role="status" className="text-secondary">Loading your Tickets...</p>}
    {state === "error" && <div className="alert alert-danger" role="alert">Unable to retrieve your Tickets. Please try again.</div>}
    {empty && <div className="alert alert-info" role="status"><strong>No Tickets yet.</strong> Create your first IT support request to see it here.</div>}
    {noResults && <div className="alert alert-warning" role="status"><strong>No matching Tickets.</strong> Try changing or clearing the search and filters.</div>}
    {state === "ready" && result && result.items.length > 0 && <>
      <div className="table-responsive d-none d-md-block"><table className="table align-middle"><thead><tr><th>Ticket Number</th><th>Summary</th><th>Category</th><th>Requested Priority</th><th>Current Status</th><th>Last Updated</th></tr></thead><tbody>{result.items.map((ticket) => <tr key={ticket.id}><td className="fw-semibold">{ticket.ticketNumber}</td><td>{ticket.summary}</td><td>{ticket.category.name}</td><td><span className="badge text-bg-secondary">{priorityLabel(ticket.requestedPriority)}</span></td><td><span className="badge text-bg-success">New</span></td><td>{formatDate(ticket.updatedAt)}</td></tr>)}</tbody></table></div>
      <div className="d-md-none">{result.items.map((ticket) => <article className="card mb-3" key={ticket.id}><div className="card-body"><div className="fw-semibold">{ticket.ticketNumber}</div><h2 className="h6 mt-2">{ticket.summary}</h2><p className="mb-2 text-secondary">{ticket.category.name} · {priorityLabel(ticket.requestedPriority)} · New</p><small>Last updated {formatDate(ticket.updatedAt)}</small></div></article>)}</div>
      <div className="d-flex justify-content-between align-items-center gap-2" aria-label="Ticket pagination"><span className="text-secondary small">{result.totalItems} Ticket{result.totalItems === 1 ? "" : "s"}</span><div className="btn-group"><button className="btn btn-outline-success" disabled={result.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: (current.page ?? 1) - 1 }))}>Previous</button><span className="btn btn-outline-secondary disabled">Page {result.page} of {result.totalPages}</span><button className="btn btn-outline-success" disabled={result.page >= result.totalPages} onClick={() => setQuery((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}>Next</button></div></div>
    </>}
  </section>;
}
