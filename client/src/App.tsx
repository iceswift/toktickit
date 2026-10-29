import { useEffect, useState } from 'react';
import { type AuthUser, type MyTicketsQuery, type StaffQueueQuery, getCurrentUser, logout } from './api.js';
import { ChangePassword } from './ChangePassword.js';
import { CreateTicketForm } from './CreateTicketForm.js';
import { Login } from './Login.js';
import { MyTickets } from './MyTickets.js';
import { RequesterTicketDetail } from './RequesterTicketDetail.js';
import { StaffTicketQueue } from './StaffTicketQueue.js';
import { StaffTicketDetail } from './StaffTicketDetail.js';
import { UserManagement } from './UserManagement.js';
import { RoleBadge } from './RoleBadge.js';
import { Dashboard, MyActions } from './Dashboard.js';
import type { Destination } from './dashboard-api.js';

type Page = 'create' | 'tickets' | 'detail' | 'queue' | 'dashboard' | 'actions';
export default function App() {
  const [user,setUser]=useState<AuthUser|null>(null),[loading,setLoading]=useState(true);
  const [page,setPage]=useState<Page>('tickets'),[back,setBack]=useState<Page>('tickets');
  const [ticketId,setTicketId]=useState<number|null>(null),[sessionError,setSessionError]=useState('');
  const [requestQuery,setRequestQuery]=useState<MyTicketsQuery>({}),[staffQuery,setStaffQuery]=useState<StaffQueueQuery>({});
  const [listKey,setListKey]=useState(0),[scopeTitle,setScopeTitle]=useState('');
  useEffect(()=>{void getCurrentUser().then(setUser).catch(()=>setUser(null)).finally(()=>setLoading(false));},[]);
  function authenticated(value:AuthUser){setUser(value);setPage('tickets');setTicketId(null);setScopeTitle('');setRequestQuery({});setStaffQuery({});setListKey(n=>n+1);}
  if(loading)return <main className="container py-5"><p role="status">Checking your session...</p></main>;
  if(!user)return <Login onAuthenticated={authenticated}/>;
  if(user.mustChangePassword)return <ChangePassword onComplete={()=>setUser(null)}/>;
  async function signOut(){setSessionError('');try{await logout();setUser(null);}catch{setSessionError('Logout could not be completed. Please try again.');}}
  function list(next:'tickets'|'queue'){setRequestQuery({});setStaffQuery({});setScopeTitle('');setListKey(n=>n+1);setPage(next);}
  function openTicket(id:number){setBack(page);setTicketId(id);setPage('detail');}
  function drillDown(destination:Destination,title:string){setScopeTitle(title);setListKey(n=>n+1);if(destination.kind==='actions')setPage('actions');else if(destination.kind==='requester'){setRequestQuery(destination.query);setPage('tickets');}else{setStaffQuery(destination.query);setPage('queue');}}
  const requester=user.role==='REQUESTER';
  return <main><nav className="navbar navbar-dark bg-success px-3 gap-2" aria-label="Application navigation">
    <span className="navbar-brand mb-0 h1">TokTickIT</span>
    <button className="btn btn-success border border-light" aria-current={page==='dashboard'?'page':undefined} onClick={()=>setPage('dashboard')}>Dashboard</button>
    {requester?<><button className="btn btn-success" onClick={()=>setPage('create')}>Create Ticket</button><button className="btn btn-success" onClick={()=>list('tickets')}>My Tickets</button></>:<>{user.role==='ADMINISTRATOR'&&<button className="btn btn-success border border-light" onClick={()=>list('tickets')}>User Management</button>}<button className="btn btn-success border border-light" onClick={()=>list('queue')}>Ticket Queue</button><button className="btn btn-success" onClick={()=>setPage('actions')}>My Actions</button></>}
    <span className="text-white ms-auto">{user.name} · {requester?'Requester':user.role==='IT_STAFF'?'IT Staff':'Administrator'} <RoleBadge role={user.role} shell/></span><button className="btn btn-outline-light btn-sm" onClick={()=>void signOut()}>Logout</button>
  </nav><section className="container py-4" style={{maxWidth:requester?900:1100}}>
    {sessionError&&<div className="alert alert-danger" role="alert">{sessionError}</div>}
    {scopeTitle&&(page==='tickets'||page==='queue')&&<div className="alert alert-success">Dashboard filter: {scopeTitle}. <button className="btn btn-link text-success" onClick={()=>setPage('dashboard')}>Back to dashboard</button></div>}
    {page==='dashboard'?<Dashboard key={user.id+':'+user.role} user={user} onOpenTicket={openTicket} onDrillDown={drillDown}/>:page==='actions'?<MyActions key={user.id} onOpenTicket={openTicket}/>:page==='detail'&&ticketId?(requester?<RequesterTicketDetail requester={user} ticketId={ticketId} onBack={()=>setPage(back)}/>:<StaffTicketDetail ticketId={ticketId} user={user} onBack={()=>setPage(back)}/>):requester?(page==='create'?<CreateTicketForm requester={user}/>:<MyTickets key={listKey} initialQuery={requestQuery} requester={user} onCreateTicket={()=>setPage('create')} onOpenTicket={openTicket}/>):user.role==='ADMINISTRATOR'&&page==='tickets'?<UserManagement user={user}/>:<StaffTicketQueue key={listKey} initialQuery={staffQuery} onOpenTicket={openTicket}/>}
  </section></main>;
}
