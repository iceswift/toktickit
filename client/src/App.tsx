import { useEffect, useState } from "react";
import { AuthUser, getCurrentUser, logout } from "./api.js";
import { ChangePassword } from "./ChangePassword.js";
import { CreateTicketForm } from "./CreateTicketForm.js";
import { Login } from "./Login.js";
import { MyTickets } from "./MyTickets.js";
import { RequesterTicketDetail } from "./RequesterTicketDetail.js";
import { StaffTicketQueue } from "./StaffTicketQueue.js";
import { StaffTicketDetail } from "./StaffTicketDetail.js";
import { UserManagement } from "./UserManagement.js";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<"create" | "tickets" | "detail" | "queue">("tickets");
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState("");
  useEffect(() => { void getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  if (loading) return <main className="container py-5"><p role="status">Checking your session...</p></main>;
  if (!user) return <Login onAuthenticated={setUser} />;
  if (user.mustChangePassword) return <ChangePassword onComplete={() => setUser(null)} />;
  async function signOut() {
    setSessionError("");
    try { await logout(); setUser(null); }
    catch { setSessionError("Logout could not be completed. Please try again."); }
  }
  if (user.role !== "REQUESTER") return <main><nav className="navbar navbar-dark bg-success px-3 gap-3" aria-label="Application navigation"><span className="navbar-brand mb-0 h1">TokTickIT</span>{user.role === "ADMINISTRATOR" && <button className="btn btn-success border border-light" onClick={() => setPage("tickets")}>User Management</button>}<button className="btn btn-success border border-light" onClick={() => setPage("queue")}>Ticket Queue</button><span className="text-white ms-auto">{user.name} · {user.role === "IT_STAFF" ? "IT Staff" : "Administrator"}</span><button className="btn btn-outline-light btn-sm" onClick={() => void signOut()}>Logout</button></nav><section className="container py-5" style={{ maxWidth: 1100 }}>{sessionError && <div className="alert alert-danger" role="alert">{sessionError}</div>}{user.role === "ADMINISTRATOR" && page === "tickets" ? <UserManagement user={user} /> : page === "detail" && ticketId ? <StaffTicketDetail ticketId={ticketId} user={user} onBack={() => setPage("queue")} /> : <StaffTicketQueue onOpenTicket={(id) => { setTicketId(id); setPage("detail"); }} />}</section></main>;
  return <main><nav className="navbar navbar-dark bg-success px-3 gap-3" aria-label="Application navigation">
    <span className="navbar-brand mb-0 h1">TokTickIT</span>
    <button className={`btn btn-success ${page === "create" ? "border border-light" : ""}`} onClick={() => setPage("create")}>Create Ticket</button>
    <button className={`btn btn-success ${page !== "create" ? "border border-light" : ""}`} onClick={() => setPage("tickets")}>My Tickets</button>
    <span className="text-white ms-auto">{user.name} · Requester</span><button className="btn btn-outline-light btn-sm" onClick={() => void signOut()}>Logout</button>
  </nav><section className="container py-5" style={{ maxWidth: 900 }}>
    {sessionError && <div className="alert alert-danger" role="alert">{sessionError}</div>}
    {page === "create" ? <CreateTicketForm requester={user} /> : page === "tickets" ? <MyTickets requester={user} onCreateTicket={() => setPage("create")} onOpenTicket={(id) => { setTicketId(id); setPage("detail"); }} /> : ticketId && <RequesterTicketDetail requester={user} ticketId={ticketId} onBack={() => setPage("tickets")} />}
  </section></main>;
}
