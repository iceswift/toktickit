import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { type AuthUser, type TicketOwner, type TicketStatus } from './api.js';
import { ActionRequestError, assignAction, createAction, editAction, getActionAssignees, getActionEvents,
  getActionSnapshot, getActions, transitionAction, type Action, type ActionEvent, type ActionFields,
  type ActionPage, type ActionSnapshot, type ActionStatus, type SavedAction } from './actions-api.js';

type TicketContext={id:number;createdAt:string;currentStatus:TicketStatus;version?:number};
type Draft=Omit<ActionFields,'actionDateTime'|'assigneeUserId'>&{dateTime:string;assignee:string};
type Editor={mode:'create'|'edit'|'assign';action?:Action;expectedVersion?:number;expectedTicketVersion:number;key:string};
const label=(text:string)=>text.toLowerCase().split('_').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
const terminal=(status:string)=>['RESOLVED','CLOSED','CANCELLED'].includes(status);
const stamp=(value:string)=>new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
function localDate(date:Date){const pad=(n:number,size=2)=>String(n).padStart(size,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(),3)}`;}
function draftOf(action:Action):Draft{return {dateTime:localDate(new Date(action.actionDateTime)),description:action.description,result:action.result,
  assignee:String(action.assignee.id),followUpRequired:action.followUpRequired,followUpNote:action.followUpNote,attachmentNotes:action.attachmentNotes};}
const emptyDraft=(actorId:number):Draft=>({dateTime:localDate(new Date()),description:'',result:'',assignee:String(actorId),followUpRequired:false,followUpNote:'',attachmentNotes:''});
function safeMessage(error:unknown,operation:'save'|'load'){
  if(error instanceof ActionRequestError && [401,403,404].includes(error.status))return error.message;
  return operation==='save'?'Unable to save the Action. Your draft is retained; retry when ready.':'Unable to load Actions. Please try again.';
}

export function ActionsTaken({ticket,user,onChanged}:{ticket:TicketContext;user:AuthUser;onChanged?:()=>Promise<void>}){
  const prefix=useId();const readOnly=user.role==='REQUESTER';
  const [list,setList]=useState<ActionPage|null>(null);const [snapshot,setSnapshot]=useState<ActionSnapshot|null>(null);
  const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [page,setPage]=useState(1);const [pageSize,setPageSize]=useState(10);
  const [owners,setOwners]=useState<TicketOwner[]>([]);const [ownersLoading,setOwnersLoading]=useState(false);const [ownersError,setOwnersError]=useState('');
  const [editor,setEditor]=useState<Editor|null>(null);const [draft,setDraft]=useState<Draft>(()=>emptyDraft(user.id));
  const [fields,setFields]=useState<Record<string,string>>({});const [busy,setBusy]=useState(false);
  const [conflict,setConflict]=useState(false);const [conflictCode,setConflictCode]=useState('');const [reconciled,setReconciled]=useState(false);
  const [confirmation,setConfirmation]=useState<{action:Action;status:ActionStatus;ticketVersion:number}|null>(null);
  const [history,setHistory]=useState<{actionId:number;items:ActionEvent[];loading:boolean;error:string}|null>(null);
  const busyRef=useRef(false);const sequence=useRef(0);const historySequence=useRef(0);const alive=useRef(true);const formHeading=useRef<HTMLHeadingElement>(null);
  const terminalTicket=terminal(ticket.currentStatus)||!!snapshot&&terminal(snapshot.currentStatus);
  const writeBlocked=readOnly||!snapshot||terminalTicket;
  async function load(nextPage=page,size=pageSize){
    const requestId=++sequence.current;setLoading(true);setError('');
    try{
      const [rows,current]=await Promise.all([getActions(ticket.id,readOnly,nextPage,size),readOnly?Promise.resolve(null):getActionSnapshot(ticket.id)]);
      if(!alive.current||requestId!==sequence.current)return false;
      setList(rows);setSnapshot(current);setPage(rows.page);setPageSize(rows.pageSize);return true;
    }catch(failure){if(alive.current&&requestId===sequence.current){setError(safeMessage(failure,'load'));setList(null);setSnapshot(null);}return false;}
    finally{if(alive.current&&requestId===sequence.current)setLoading(false);}
  }
  async function loadOwners(){
    setOwnersLoading(true);setOwnersError('');
    try{const values=await getActionAssignees();if(alive.current)setOwners(values);}
    catch{if(alive.current)setOwnersError('Unable to load active assignees. Retry before saving.');}
    finally{if(alive.current)setOwnersLoading(false);}
  }
  useEffect(()=>{
    alive.current=true;setEditor(null);setHistory(null);setConfirmation(null);void load(1,10);if(!readOnly)void loadOwners();
    return()=>{alive.current=false;sequence.current++;};
  },[ticket.id,user.id,user.role]);
  useEffect(()=>{if(editor)formHeading.current?.focus();},[editor?.mode,editor?.action?.id]);
  useEffect(()=>{if(!readOnly&&snapshot&&(ticket.version!==undefined&&ticket.version!==snapshot.version||ticket.currentStatus!==snapshot.currentStatus))void load();},[ticket.version,ticket.currentStatus]);

  function open(mode:Editor['mode'],action?:Action){
    if(writeBlocked||!snapshot)return;
    setDraft(action?draftOf(action):emptyDraft(user.id));setFields({});setError('');setNotice('');setConflict(false);setReconciled(false);setConfirmation(null);
    setEditor({mode,action,expectedVersion:action?.version,expectedTicketVersion:snapshot.version,key:crypto.randomUUID()});
  }
  function change<K extends keyof Draft>(name:K,value:Draft[K]){setDraft(current=>({...current,[name]:value}));setFields(current=>({...current,[name==='assignee'?'assigneeUserId':name]:''}));}
  async function showHistory(actionId:number){
    const requestId=++historySequence.current;
    setHistory({actionId,items:[],loading:true,error:''});
    try{const result=await getActionEvents(ticket.id,actionId,readOnly);if(alive.current&&requestId===historySequence.current)setHistory({actionId,items:result.items,loading:false,error:''});}
    catch(failure){if(alive.current&&requestId===historySequence.current)setHistory({actionId,items:[],loading:false,error:safeMessage(failure,'load')});}
  }
  function askStatus(action:Action,status:ActionStatus){if(!snapshot)return;setEditor(null);setConfirmation({action,status,ticketVersion:snapshot.version});setError('');setConflict(false);}
  function failure(error:unknown){
    if(error instanceof ActionRequestError&&error.status===409){setConflict(true);setReconciled(false);setConflictCode(error.code);setError('The saved Ticket or Action changed. Your draft is retained; refresh and reconcile before submitting.');}
    else{setError(safeMessage(error,'save'));if(error instanceof ActionRequestError){setFields({...error.fields,...(error.fields.actionDateTime?{dateTime:error.fields.actionDateTime}:{})});if(error.fields.assigneeUserId)void loadOwners();}}
  }
  async function saved(result:SavedAction){
    setEditor(null);setConfirmation(null);setConflict(false);setFields({});setNotice('Action saved.');
    setSnapshot(current=>current?{...current,version:result.ticketVersion}:current);
    await load();if(history?.actionId===result.action.id)await showHistory(result.action.id);
    if(onChanged)try{await onChanged();}catch{setError('Action saved, but the Ticket summary could not refresh. Refresh Actions before another change.');}
  }
  async function submit(event:FormEvent){
    event.preventDefault();if(!editor||busyRef.current||writeBlocked||conflict)return;
    const invalid:Record<string,string>={};const when=new Date(draft.dateTime);
    if(editor.mode!=='assign'){
      if(!draft.description.trim())invalid.description='Enter an Action description.';
      for(const field of ['description','result','followUpNote','attachmentNotes'] as const)if(draft[field].trim().length>2000)invalid[field]='Use at most 2,000 characters.';
      if(!draft.dateTime||!Number.isFinite(when.getTime())||when<new Date(ticket.createdAt)||when>new Date())invalid.dateTime='Choose a time between Ticket creation and now.';
      if(draft.followUpRequired&&!draft.followUpNote.trim())invalid.followUpNote='Enter a Follow-up note.';
      if(editor.action?.status==='COMPLETED'&&!draft.result.trim())invalid.result='A completed Action requires a Result.';
    }
    if(editor.mode!=='edit'&&!owners.some(owner=>String(owner.id)===draft.assignee))invalid.assigneeUserId='Choose a valid active assignee.';
    setFields(invalid);
    if(Object.keys(invalid).length){document.getElementById(`${prefix}-${Object.keys(invalid)[0]}`)?.focus();return;}
    busyRef.current=true;setBusy(true);setError('');setNotice('');
    const data={actionDateTime:when.toISOString(),description:draft.description.trim(),result:draft.result.trim(),followUpRequired:draft.followUpRequired,
      followUpNote:draft.followUpNote.trim(),attachmentNotes:draft.attachmentNotes.trim(),expectedTicketVersion:editor.expectedTicketVersion};
    try{
      const result=editor.mode==='create'?await createAction(ticket.id,{...data,assigneeUserId:Number(draft.assignee)},editor.key)
        :editor.mode==='assign'?await assignAction(ticket.id,editor.action!.id,{assigneeUserId:Number(draft.assignee),expectedVersion:editor.expectedVersion!,expectedTicketVersion:editor.expectedTicketVersion})
        :await editAction(ticket.id,editor.action!.id,{...data,expectedVersion:editor.expectedVersion!});
      if(alive.current)await saved(result);
    }catch(error){if(alive.current)failure(error);}
    finally{busyRef.current=false;if(alive.current)setBusy(false);}
  }
  async function confirmStatus(){
    if(!confirmation||!snapshot||busyRef.current||writeBlocked)return;
    busyRef.current=true;setBusy(true);setError('');setNotice('');
    try{const result=await transitionAction(ticket.id,confirmation.action.id,{status:confirmation.status,expectedVersion:confirmation.action.version,expectedTicketVersion:confirmation.ticketVersion});if(alive.current)await saved(result);}
    catch(error){if(alive.current){failure(error);setConfirmation(null);}}
    finally{busyRef.current=false;if(alive.current)setBusy(false);}
  }
  async function refreshConflict(){
    if(await load()){setReconciled(true);setError('Latest saved values loaded. Your draft is unchanged; compare it with the saved Action before using the latest versions.');}
  }
  function rebase(){
    if(!editor||!snapshot||!reconciled||writeBlocked)return;
    const current=editor.action?list?.items.find(row=>row.id===editor.action!.id):undefined;
    if(editor.action&&!current){setError('The Action moved out of this page. Find its page before reconciling; your draft is retained.');return;}
    setEditor({...editor,action:current,expectedVersion:current?.version,expectedTicketVersion:snapshot.version,
      key:conflictCode==='IDEMPOTENCY_CONFLICT'?crypto.randomUUID():editor.key});setConflict(false);setReconciled(false);setError('');
  }
  const bad=(name:string)=>!!fields[name];
  const fieldProps=(name:string)=>({id:`${prefix}-${name}`,'aria-invalid':bad(name)||undefined,'aria-describedby':bad(name)?`${prefix}-${name}-error`:undefined});
  const fieldError=(name:string)=>fields[name]?<p id={`${prefix}-${name}-error`} className="text-danger small mb-0">{fields[name]}</p>:null;
  const latestEdited=editor?.action?list?.items.find(row=>row.id===editor.action!.id):null;

  return <section className="card shadow-sm my-4" aria-labelledby={`${prefix}-heading`} style={{overflowWrap:'anywhere',minWidth:0}}>
    <div className="card-body"><div className="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-2"><h2 className="h5 mb-0" id={`${prefix}-heading`}>Actions Taken</h2>
      <button type="button" className="btn btn-sm btn-outline-success" disabled={loading||busy} onClick={()=>void load()}>Refresh Actions</button></div>
      <p className="text-secondary small">Shared work history — separate from private Internal Notes. {readOnly?'Requester access is read-only.':'The recorded performer and assigned person can be different.'}</p>
      {notice&&<p className="alert alert-success" role="status">{notice}</p>}
      {error&&<div className="alert alert-danger" role="alert">{error}{!editor&&!conflict&&<button type="button" className="btn btn-sm btn-outline-danger d-block mt-2" disabled={busy||loading} onClick={()=>void load()}>Retry Actions</button>}</div>}
      {loading&&<p role="status">Loading Actions...</p>}
      {terminalTicket&&!readOnly&&<p className="alert alert-secondary">This Ticket is read-only for Action changes. Existing work and history remain visible.</p>}
      {!readOnly&&!editor&&snapshot&&!writeBlocked&&<button className="btn btn-success mb-3" disabled={busy||loading} onClick={()=>open('create')}>Record an Action</button>}
      {list&&!loading&&list.items.length===0&&<p>No Actions have been recorded.</p>}
      {list?.items.map(action=><article className="border rounded p-3 mb-3" key={action.id} aria-label={`Action ${action.id}`}>
        <div className="d-flex flex-wrap justify-content-between gap-2"><h3 className="h6">Action #{action.id} · {stamp(action.actionDateTime)}</h3><span className={`badge align-self-start ${action.status==='COMPLETED'?'text-bg-success':'text-bg-secondary'}`}>{label(action.status)}</span></div>
        <p style={{whiteSpace:'pre-wrap'}}>{action.description}</p><dl className="row small mb-2">
          <dt className="col-sm-3">Performed by</dt><dd className="col-sm-9">{action.performedBy.name}</dd><dt className="col-sm-3">Assigned to</dt><dd className="col-sm-9">{action.assignee.name}{!action.assignee.isActive?' · Inactive':''}</dd>
          <dt className="col-sm-3">Result</dt><dd className="col-sm-9" style={{whiteSpace:'pre-wrap'}}>{action.result||'Not recorded'}</dd>
          <dt className="col-sm-3">Follow-up</dt><dd className="col-sm-9">{action.followUpRequired?'Required':'Not required'}{action.followUpNote&&<p className="mb-0" style={{whiteSpace:'pre-wrap'}}>{action.followUpNote}</p>}</dd>
          <dt className="col-sm-3">Attachment notes</dt><dd className="col-sm-9" style={{whiteSpace:'pre-wrap'}}>{action.attachmentNotes||'None'}</dd>
          <dt className="col-sm-3">Recorded at</dt><dd className="col-sm-9">{stamp(action.createdAt)} · Version {action.version}</dd></dl>
        <div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-secondary" disabled={busy} onClick={()=>void showHistory(action.id)}>View history</button>
          {!writeBlocked&&<><button className="btn btn-sm btn-outline-success" disabled={busy||loading||!!editor} onClick={()=>open('edit',action)}>Edit Action</button><button className="btn btn-sm btn-outline-success" disabled={busy||loading||!!editor} onClick={()=>open('assign',action)}>Change assignee</button>
            {action.status==='PLANNED'&&<button className="btn btn-sm btn-success" disabled={busy||loading||!!editor} onClick={()=>askStatus(action,'IN_PROGRESS')}>Start Action</button>}
            {action.status==='IN_PROGRESS'&&<button className="btn btn-sm btn-success" disabled={busy||loading||!!editor} onClick={()=>askStatus(action,'COMPLETED')}>Complete Action</button>}
            {['PLANNED','IN_PROGRESS'].includes(action.status)&&<button className="btn btn-sm btn-outline-danger" disabled={busy||loading||!!editor} onClick={()=>askStatus(action,'CANCELLED')}>Cancel Action</button>}</>}
        </div>
      </article>)}
      {list&&list.totalItems>0&&<nav className="d-flex flex-wrap align-items-center gap-2 mb-3" aria-label="Action pagination">
        <button className="btn btn-sm btn-outline-success" disabled={busy||loading||page<=1} onClick={()=>void load(page-1)}>Previous Actions</button>
        <span>Page {list.page} of {list.totalPages} · {list.totalItems} Actions</span><button className="btn btn-sm btn-outline-success" disabled={busy||loading||page>=list.totalPages} onClick={()=>void load(page+1)}>Next Actions</button>
        <label htmlFor={`${prefix}-pageSize`}>Actions per page</label><select id={`${prefix}-pageSize`} className="form-select form-select-sm w-auto" value={pageSize} disabled={busy||loading} onChange={event=>void load(1,Number(event.target.value))}>{[10,20,50].map(size=><option key={size}>{size}</option>)}</select></nav>}
      {history&&<section className="border rounded bg-light p-3 mb-3" role="region" aria-label={`Action ${history.actionId} history`}><div className="d-flex flex-wrap justify-content-between gap-2"><h3 className="h6">Action #{history.actionId} history (read-only)</h3><button className="btn btn-sm btn-outline-secondary" onClick={()=>setHistory(null)}>Close history</button></div>
        {history.loading?<p role="status">Loading Action history...</p>:history.error?<div role="alert">{history.error}<button className="btn btn-sm btn-outline-success ms-2" onClick={()=>void showHistory(history.actionId)}>Retry history</button></div>:history.items.length===0?<p>No history recorded.</p>:<ol className="ps-3">{history.items.map(event=><li className="mb-3" key={event.id}><strong>{label(event.type)}</strong> · {event.actor.name} · Version {event.version} · {stamp(event.createdAt)}<pre className="small mb-0" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(event.changes,null,2)}</pre></li>)}</ol>}
      </section>}
      {confirmation&&!writeBlocked&&<section className="border border-success rounded p-3 mb-3" aria-label="Confirm Action status"><h3 className="h6">Change Action #{confirmation.action.id} to {label(confirmation.status)}?</h3><p>Status changes append history and cannot reopen terminal work.</p>
        {confirmation.status==='COMPLETED'&&!confirmation.action.result.trim()?<><p role="alert">Add a Result using Edit Action before completing.</p><button className="btn btn-outline-success" onClick={()=>open('edit',confirmation.action)}>Edit Result first</button></>:<button className={`btn ${confirmation.status==='CANCELLED'?'btn-danger':'btn-success'}`} disabled={busy} onClick={()=>void confirmStatus()}>{busy?'Saving status...':`Confirm ${label(confirmation.status)}`}</button>}
        <button className="btn btn-link" disabled={busy} onClick={()=>setConfirmation(null)}>Keep current status</button></section>}
      {conflict&&<section className="alert alert-warning" aria-label="Reconcile Action conflict"><p>Your draft has not been overwritten. Refresh the saved data, compare it below, then explicitly adopt its current versions.</p>
        <button className="btn btn-outline-success me-2 mb-2" disabled={loading||busy} onClick={()=>void refreshConflict()}>Refresh latest versions</button>
        {editor&&reconciled&&<><p>Latest Ticket version: {snapshot?.version}. {latestEdited?`Latest Action version: ${latestEdited.version}.`:editor.action?'Find this Action on its current page before reconciling.':''}</p><button className="btn btn-warning mb-2" disabled={writeBlocked||busy||!!editor.action&&!latestEdited} onClick={rebase}>{conflictCode==='IDEMPOTENCY_CONFLICT'?'Start new Action with this draft (new retry key)':'Use latest versions for this draft'}</button></>}
        {!editor&&reconciled&&<button className="btn btn-outline-success" onClick={()=>{setConflict(false);setError('');}}>Continue with refreshed Actions</button>}
      </section>}
      {editor&&!readOnly&&<form noValidate onSubmit={event=>void submit(event)} className="border rounded p-3 bg-light" aria-label="Action form">
        <h3 className="h5" tabIndex={-1} ref={formHeading}>{editor.mode==='create'?'Record an Action':editor.mode==='assign'?'Change Action assignee':'Edit Action'}</h3>
        <p className="small">Draft uses Ticket version {editor.expectedTicketVersion}{editor.expectedVersion?`, Action version ${editor.expectedVersion}`:''}. Changes append history; there is no Delete operation.</p>
        <fieldset disabled={busy} className="border-0 p-0 m-0"><legend className="visually-hidden">Action details</legend>
          <div className="row g-3"><div className="col-md-6"><label className="form-label" htmlFor={`${prefix}-performer`}>Recorded performer (read-only)</label><input id={`${prefix}-performer`} className="form-control bg-body-secondary" value={editor.action?.performedBy.name??user.name} readOnly/></div><div className="col-md-6"><label className="form-label" htmlFor={`${prefix}-createdAt`}>Creation time (server, read-only)</label><input id={`${prefix}-createdAt`} className="form-control bg-body-secondary" readOnly value={editor.action?stamp(editor.action.createdAt):'Set by server after saving'}/></div>
            {editor.mode!=='assign'&&<><div className="col-md-6"><label className="form-label" htmlFor={`${prefix}-dateTime`}>Action date and time</label><input {...fieldProps('dateTime')} className="form-control" style={{minWidth:0,maxWidth:'100%'}} type="datetime-local" step="0.001" required value={draft.dateTime} onChange={event=>change('dateTime',event.target.value)}/>{fieldError('dateTime')}<small className="text-secondary">Your local time; sent with an explicit timezone.</small></div></>}
            {editor.mode!=='edit'&&<div className="col-md-6"><label className="form-label" htmlFor={`${prefix}-assigneeUserId`}>Assigned to</label><select {...fieldProps('assigneeUserId')} className="form-select" value={draft.assignee} onChange={event=>change('assignee',event.target.value)} disabled={busy||ownersLoading} required><option value="">Choose an active assignee</option>{draft.assignee&&!owners.some(owner=>String(owner.id)===draft.assignee)&&<option value={draft.assignee} disabled>Previously selected assignee unavailable</option>}{owners.map(owner=><option value={owner.id} key={owner.id}>{owner.name} · {label(owner.role)}</option>)}</select>{ownersLoading&&<p role="status">Loading active assignees...</p>}{fieldError('assigneeUserId')}{ownersError&&<div role="alert">{ownersError}<button type="button" className="btn btn-sm btn-outline-success" onClick={()=>void loadOwners()}>Retry assignees</button></div>}</div>}
            {editor.mode!=='assign'&&<><div className="col-12"><label className="form-label" htmlFor={`${prefix}-description`}>Action description</label><textarea {...fieldProps('description')} className="form-control" rows={3} maxLength={2000} required value={draft.description} onChange={event=>change('description',event.target.value)}/>{fieldError('description')}</div>
              <div className="col-12"><label className="form-label" htmlFor={`${prefix}-result`}>Result</label><textarea {...fieldProps('result')} className="form-control" maxLength={2000} rows={2} value={draft.result} onChange={event=>change('result',event.target.value)}/>{fieldError('result')}<small className="text-secondary">Required before completion.</small></div>
              <div className="col-12"><div className="form-check"><input id={`${prefix}-followUpRequired`} className="form-check-input" type="checkbox" checked={draft.followUpRequired} onChange={event=>change('followUpRequired',event.target.checked)}/><label className="form-check-label" htmlFor={`${prefix}-followUpRequired`}>Follow-up required</label></div></div>
              {(draft.followUpRequired||draft.followUpNote)&&<div className="col-12"><label className="form-label" htmlFor={`${prefix}-followUpNote`}>Follow-up note</label><textarea {...fieldProps('followUpNote')} className="form-control" rows={2} maxLength={2000} required={draft.followUpRequired} value={draft.followUpNote} onChange={event=>change('followUpNote',event.target.value)}/>{fieldError('followUpNote')}</div>}
              <div className="col-12"><label className="form-label" htmlFor={`${prefix}-attachmentNotes`}>Attachment notes</label><textarea {...fieldProps('attachmentNotes')} className="form-control" rows={2} maxLength={2000} value={draft.attachmentNotes} onChange={event=>change('attachmentNotes',event.target.value)}/>{fieldError('attachmentNotes')}</div></>}
          </div><p className="small text-secondary mt-3">Your edit will be recorded as {user.name}. Existing creator and creation time cannot be changed.</p>
          <div className="d-flex flex-wrap gap-2"><button className="btn btn-success" disabled={busy||loading||writeBlocked||conflict||editor.mode!=='edit'&&(ownersLoading||!!ownersError)}>{busy?'Saving Action...':'Save Action'}</button><button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={()=>{setEditor(null);setFields({});setConflict(false);setError('');}}>Discard draft</button></div>
        </fieldset>{busy&&<p role="status" className="mt-2 mb-0">Saving Action; please wait.</p>}
      </form>}
    </div>
  </section>;
}
