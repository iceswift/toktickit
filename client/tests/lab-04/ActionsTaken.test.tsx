import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionsTaken } from '../../src/ActionsTaken.js';
import * as actions from '../../src/actions-api.js';

vi.mock('../../src/actions-api.js', async original => ({ ...await original<typeof import('../../src/actions-api.js')>(),
  getActions:vi.fn(),getActionEvents:vi.fn(),getActionSnapshot:vi.fn(),getActionAssignees:vi.fn(),
  createAction:vi.fn(),editAction:vi.fn(),assignAction:vi.fn(),transitionAction:vi.fn(),
}));
const user={id:7,name:'Iris Staff',email:'iris@example.test',role:'IT_STAFF' as const,mustChangePassword:false};
const ticket={id:41,currentStatus:'OPEN' as const,createdAt:'2026-10-28T01:00:00Z'};
const action:actions.Action={id:1,ticketId:41,performedBy:{id:7,name:'Iris Staff'},assignee:{id:8,name:'Jonas Staff',isActive:true},
  description:'Inspect connection',result:'',actionDateTime:'2026-10-28T02:00:00Z',followUpRequired:false,followUpNote:'',attachmentNotes:'',
  status:'PLANNED',version:1,createdAt:'2026-10-28T02:00:00Z',updatedAt:'2026-10-28T02:00:00Z'};
beforeEach(()=>{
  vi.mocked(actions.getActions).mockResolvedValue({items:[action],page:1,pageSize:10,totalItems:1,totalPages:1});
  vi.mocked(actions.getActionSnapshot).mockResolvedValue({...ticket,version:2});
  vi.mocked(actions.getActionAssignees).mockResolvedValue([{id:7,name:'Iris Staff',role:'IT_STAFF'},{id:8,name:'Jonas Staff',role:'IT_STAFF'}]);
  vi.mocked(actions.getActionEvents).mockResolvedValue({items:[{id:1,type:'CREATED',actor:{id:7,name:'Iris Staff'},version:1,createdAt:action.createdAt,changes:{description:'Inspect connection'}}]});
});
afterEach(()=>vi.clearAllMocks());
async function createForm(){const actor=userEvent.setup();await actor.click(await screen.findByRole('button',{name:'Record an Action'}));return actor;}
async function fillDraft(actor:ReturnType<typeof userEvent.setup>){await actor.type(screen.getByLabelText('Action description'),'Repair network');}

describe('Actions Taken role-aware UI',()=>{
  it('renders separate performer/assignee and read-only Requester history without fetching staff data',async()=>{
    render(<ActionsTaken ticket={ticket} user={{...user,role:'REQUESTER'}}/>);
    const card=await screen.findByRole('article',{name:'Action 1'});
    expect(within(card).getByText('Iris Staff')).toBeInTheDocument();expect(within(card).getByText('Jonas Staff')).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Record an Action'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Edit Action'})).not.toBeInTheDocument();
    await userEvent.click(within(card).getByRole('button',{name:'View history'}));
    expect(await screen.findByRole('region',{name:'Action 1 history'})).toHaveTextContent('Created');
    expect(actions.getActionSnapshot).not.toHaveBeenCalled();expect(actions.getActionAssignees).not.toHaveBeenCalled();
  });
  it('validates required description and conditional follow-up note near fields without an API call',async()=>{
    render(<ActionsTaken ticket={ticket} user={user}/>);const actor=await createForm();
    await actor.click(screen.getByRole('button',{name:'Save Action'}));
    expect(screen.getByLabelText('Action description')).toHaveAttribute('aria-invalid','true');
    await fillDraft(actor);await actor.click(screen.getByLabelText('Follow-up required'));
    await actor.click(screen.getByRole('button',{name:'Save Action'}));
    expect(screen.getByLabelText('Follow-up note')).toHaveAttribute('aria-invalid','true');expect(actions.createAction).not.toHaveBeenCalled();
  });
  it('retains the draft and same logical retry key through a recoverable API failure',async()=>{
    vi.mocked(actions.createAction).mockRejectedValueOnce(new actions.ActionRequestError(503,'UNAVAILABLE'))
      .mockResolvedValueOnce({action:{...action,id:2,description:'Repair network'},ticketVersion:3,replayed:true});
    render(<ActionsTaken ticket={ticket} user={user}/>);const actor=await createForm();await fillDraft(actor);
    await actor.click(screen.getByRole('button',{name:'Save Action'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save');
    expect(screen.getByLabelText('Action description')).toHaveValue('Repair network');
    await actor.click(screen.getByRole('button',{name:'Save Action'}));
    await screen.findByText('Action saved.');
    const calls=vi.mocked(actions.createAction).mock.calls;expect(calls).toHaveLength(2);expect(calls[0][2]).toBe(calls[1][2]);
    expect(calls[0][1]).not.toHaveProperty('performedByUserId');
  });
  it('requires deliberate refresh/reconcile for a stale version while preserving edited values',async()=>{
    vi.mocked(actions.editAction).mockRejectedValueOnce(new actions.ActionRequestError(409,'STALE_VERSION'));
    render(<ActionsTaken ticket={ticket} user={user}/>);const actor=userEvent.setup();
    await actor.click(await screen.findByRole('button',{name:'Edit Action'}));
    await actor.clear(screen.getByLabelText('Action description'));await actor.type(screen.getByLabelText('Action description'),'My unsaved revision');
    await actor.click(screen.getByRole('button',{name:'Save Action'}));
    expect(await screen.findByRole('button',{name:'Refresh latest versions'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Save Action'})).toBeDisabled();
    vi.mocked(actions.getActionSnapshot).mockResolvedValue({...ticket,version:4});
    vi.mocked(actions.getActions).mockResolvedValue({items:[{...action,version:3}],page:1,pageSize:10,totalItems:1,totalPages:1});
    await actor.click(screen.getByRole('button',{name:'Refresh latest versions'}));
    await actor.click(await screen.findByRole('button',{name:'Use latest versions for this draft'}));
    expect(screen.getByLabelText('Action description')).toHaveValue('My unsaved revision');
    expect(screen.getByRole('button',{name:'Save Action'})).toBeEnabled();expect(actions.editAction).toHaveBeenCalledTimes(1);
  });
  it('shows inactive-assignee server validation without clearing the form',async()=>{
    vi.mocked(actions.createAction).mockRejectedValue(new actions.ActionRequestError(400,'VALIDATION_ERROR',{assigneeUserId:'Choose a valid active assignee.'}));
    render(<ActionsTaken ticket={ticket} user={user}/>);const actor=await createForm();await fillDraft(actor);
    await actor.click(screen.getByRole('button',{name:'Save Action'}));
    expect(await screen.findByText('Choose a valid active assignee.')).toBeInTheDocument();
    expect(screen.getByLabelText('Assigned to')).toHaveAttribute('aria-invalid','true');expect(screen.getByLabelText('Action description')).toHaveValue('Repair network');
  });
  it('shows terminal work/history but does not offer further status changes or deletion',async()=>{
    vi.mocked(actions.getActions).mockResolvedValue({items:[{...action,status:'COMPLETED',result:'Restored'}],page:1,pageSize:10,totalItems:1,totalPages:1});
    render(<ActionsTaken ticket={{...ticket,currentStatus:'CLOSED'}} user={user}/>);
    await screen.findByText('Restored');expect(screen.queryByRole('button',{name:'Complete Action'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Cancel Action'})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Delete Action'})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'View history'})).toBeInTheDocument();
  });
  it('freezes status-confirmation versions even if the saved Ticket is refreshed before confirmation',async()=>{
    vi.mocked(actions.transitionAction).mockRejectedValue(new actions.ActionRequestError(409,'STALE_VERSION'));
    render(<ActionsTaken ticket={ticket} user={user}/>);const actor=userEvent.setup();
    await actor.click(await screen.findByRole('button',{name:'Start Action'}));
    vi.mocked(actions.getActionSnapshot).mockResolvedValue({...ticket,version:9});
    await actor.click(screen.getByRole('button',{name:'Refresh Actions'}));
    await actor.click(screen.getByRole('button',{name:'Confirm In Progress'}));
    expect(actions.transitionAction).toHaveBeenCalledWith(41,1,{status:'IN_PROGRESS',expectedVersion:1,expectedTicketVersion:2});
    await screen.findByRole('button',{name:'Refresh latest versions'});
  });
  it('prevents duplicate submissions while the original create request is pending',async()=>{
    let finish!:(value:actions.SavedAction)=>void;
    vi.mocked(actions.createAction).mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
    render(<ActionsTaken ticket={ticket} user={user}/>);const actor=await createForm();await fillDraft(actor);
    await actor.dblClick(screen.getByRole('button',{name:'Save Action'}));
    expect(actions.createAction).toHaveBeenCalledTimes(1);expect(screen.getByLabelText('Action description')).toBeDisabled();
    finish({action,ticketVersion:3});await screen.findByText('Action saved.');
  });
  it('allows an Administrator to record work with the actor identity read-only',async()=>{
    render(<ActionsTaken ticket={ticket} user={{...user,role:'ADMINISTRATOR'}}/>);await createForm();
    expect(screen.getByLabelText('Recorded performer (read-only)')).toHaveAttribute('readonly');
    expect(screen.getByRole('button',{name:'Save Action'})).toBeEnabled();
  });
  it('shows a safe forbidden state and offers a successful read retry without disclosing data',async()=>{
    vi.mocked(actions.getActions).mockRejectedValueOnce(new actions.ActionRequestError(403,'FORBIDDEN'));
    render(<ActionsTaken ticket={ticket} user={user}/>);
    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Record an Action'})).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button',{name:'Retry Actions'}));
    await screen.findByRole('article',{name:'Action 1'});
  });
});
