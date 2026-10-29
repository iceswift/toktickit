import { useEffect, useId, useRef, useState } from 'react';
import type { AuthUser, TicketStatus } from './api.js';
import { changeWorkflow, getWorkflow, WorkflowError, type WorkflowState } from './workflow-api.js';
const label=(value:string)=>value.toLowerCase().split('_').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');
const reasons:Record<string,string>={NO_COMPLETED_ACTION:'Record and complete at least one Action.',OPEN_ACTIONS:'Complete or cancel every Planned / In Progress Action.',FOLLOW_UP_PENDING:'Clear outstanding follow-up through an audited Action edit.'};
type Selection={status:TicketStatus;version:number;from:TicketStatus};
export function TicketWorkflow({ticketId,user,version,onChanged}:{ticketId:number;user:AuthUser;version?:number;onChanged?:()=>Promise<void>}){
  const id=useId(),readOnly=user.role==='REQUESTER';const [data,setData]=useState<WorkflowState|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [selection,setSelection]=useState<Selection|null>(null),[confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[conflict,setConflict]=useState(false),[canReconcile,setCanReconcile]=useState(false);
  const requestId=useRef(0),alive=useRef(true),saving=useRef(false),heading=useRef<HTMLHeadingElement>(null);
  async function refresh(manual=false){const seq=++requestId.current;setLoading(true);setError('');setCanReconcile(false);try{const latest=await getWorkflow(ticketId,readOnly);if(alive.current&&seq===requestId.current){setData(latest);setCanReconcile(manual);}}catch(e){if(alive.current&&seq===requestId.current){setData(null);setError(e instanceof WorkflowError?e.message:'Unable to load Ticket workflow.');}}finally{if(alive.current&&seq===requestId.current)setLoading(false);}}
  useEffect(()=>{alive.current=true;void refresh();return()=>{alive.current=false;requestId.current++;};},[ticketId,user.id,user.role,version]);
  useEffect(()=>{if(confirm)heading.current?.focus();},[confirm]);
  const stale=!!selection&&!!data&&(selection.version!==data.ticket.version||selection.from!==data.ticket.currentStatus);
  const allowed=!!selection&&!!data?.eligibility.allowedTransitions.includes(selection.status);
  const blocked=!!selection&&!!data&&(selection.status==='RESOLVED'&&data.eligibility.resolutionReasons.length>0||selection.status==='CANCELLED'&&data.eligibility.cancelBlocked);
  async function save(){
    if(!selection||!data||readOnly||saving.current||loading||stale||conflict||!allowed||blocked)return;
    saving.current=true;setBusy(true);setError('');setNotice('');
    try{await changeWorkflow(ticketId,selection.status,selection.version);if(!alive.current)return;setSelection(null);setConfirm(false);setConflict(false);setNotice('Ticket status saved.');await refresh();if(onChanged)try{await onChanged();}catch{setError('Status saved, but the Ticket summary could not refresh. Refresh before another change.');}}
    catch(e){if(alive.current){setConfirm(false);if(e instanceof WorkflowError&&e.status===409){setCanReconcile(false);setConflict(true);setError(e.reason&&reasons[e.reason]?reasons[e.reason]+' Refresh and review the saved state.':'Saved state changed or transition is no longer allowed. Refresh and review before trying again.');}else{setError(e instanceof WorkflowError?e.message:'Unable to save Ticket status. Your selection is retained.');if(e instanceof WorkflowError&&[401,403,404].includes(e.status))setData(null);}}}
    finally{saving.current=false;if(alive.current)setBusy(false);}
  }
  return <section className="card my-4 shadow-sm" aria-label="Ticket Workflow" style={{minWidth:0,overflowWrap:'anywhere'}}><div className="card-body">
    <div className="d-flex flex-wrap justify-content-between gap-2 mb-2"><h2 className="h5">Ticket Workflow</h2><button className="btn btn-sm btn-outline-success" disabled={loading||busy} onClick={()=>void refresh(true)}>Refresh workflow</button></div>
    <p className="small text-secondary">Formal status is controlled by Staff / Administrator. Requester resolution indication is advisory only. Shared status history never contains private Internal Notes.</p>
    {loading&&<p role="status">Loading Ticket workflow...</p>}{error&&<div role="alert" className="alert alert-danger">{error}</div>}{notice&&<p role="status" className="alert alert-success">{notice}</p>}
    {data&&<><p>Current status: <strong>{label(data.ticket.currentStatus)}</strong> · Ticket version {data.ticket.version}</p>
      <p className="small">Last resolved time: {data.ticket.lastResolvedAt?new Date(data.ticket.lastResolvedAt).toLocaleString():'Unknown / not recorded (legacy dates are not invented)'}</p>
      {!readOnly&&<><div className="alert alert-secondary"><h3 className="h6">Resolution requirements</h3>{data.eligibility.resolutionReasons.length?<ul className="mb-0">{data.eligibility.resolutionReasons.map(r=><li key={r}>{reasons[r]}</li>)}</ul>:<p className="mb-0">Work and follow-up requirements satisfied. The current status matrix and server version checks still apply.</p>}{data.eligibility.cancelBlocked&&<p className="mb-0 mt-2">Cancel is blocked while Actions remain Planned / In Progress.</p>}</div>
        {data.eligibility.allowedTransitions.length>0?<><label htmlFor={`${id}-status`} className="form-label">New Ticket status</label><select className="form-select" id={`${id}-status`} value={selection?.status??''} disabled={busy||loading||confirm} onChange={e=>{setSelection(e.target.value?{status:e.target.value as TicketStatus,version:data.ticket.version,from:data.ticket.currentStatus}:null);setConflict(false);setError('');setNotice('');}}><option value="">Choose an allowed transition</option>{selection&&!data.eligibility.allowedTransitions.includes(selection.status)&&<option value={selection.status} disabled>{label(selection.status)} — no longer allowed</option>}{data.eligibility.allowedTransitions.map(s=><option value={s} key={s}>{label(s)}</option>)}</select>
          {selection&&<p className="small mt-2">Selection retained: {label(selection.from)} → {label(selection.status)}, based on version {selection.version}.</p>}
          {(stale||conflict)&&<div className="alert alert-warning mt-2"><p>Refresh the workflow and compare history. Your selection has not been rebased automatically.</p>{data&&allowed&&canReconcile&&<button className="btn btn-outline-success" disabled={loading||busy} onClick={()=>{setSelection(current=>current?{...current,version:data.ticket.version,from:data.ticket.currentStatus}:current);setConflict(false);setConfirm(false);setError('');}}>Use latest version for this selection</button>}</div>}
          {blocked&&<p className="text-danger mt-2" role="alert">This transition is blocked by the work requirements above.</p>}
          <button className="btn btn-success mt-2" disabled={!selection||busy||loading||stale||conflict||blocked||!allowed||confirm} onClick={()=>setConfirm(true)}>Review transition</button>
        </>:<p className="alert alert-secondary">No further transitions are allowed from {label(data.ticket.currentStatus)}. Existing work/history remain visible.</p>}
      </>}
      {readOnly&&<p className="alert alert-secondary">Requester access is read-only. An indication never resolves or closes the Ticket.</p>}
      {confirm&&selection&&!readOnly&&<section className="border border-success rounded p-3 mt-3" aria-label="Confirm Ticket transition"><h3 className="h6" tabIndex={-1} ref={heading}>Confirm {label(selection.from)} → {label(selection.status)}?</h3><p>Uses Ticket version {selection.version}; a successful transition appends immutable history.</p><button className="btn btn-success me-2" disabled={busy||loading||stale||conflict||blocked||!allowed} onClick={()=>void save()}>{busy?'Saving Ticket status...':'Confirm transition'}</button><button className="btn btn-outline-secondary" disabled={busy} onClick={()=>setConfirm(false)}>Keep current Ticket status</button></section>}
      <h3 className="h6 mt-4">Ticket status history (read-only)</h3>{!data.items.length?<p>No recorded transitions. Legacy status is not reconstructed.</p>:<ol className="ps-3">{data.items.map(e=><li className="mb-2" key={e.id}><strong>{label(e.fromStatus)} → {label(e.toStatus)}</strong> · {e.actor.name} · {new Date(e.createdAt).toLocaleString()} · Version {e.version}</li>)}</ol>}
    </>}
    {!data&&!loading&&<button className="btn btn-outline-success" onClick={()=>void refresh()}>Retry workflow</button>}
  </div></section>;
}
