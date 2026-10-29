import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketWorkflow } from '../../src/TicketWorkflow.js';
import * as api from '../../src/workflow-api.js';
vi.mock('../../src/workflow-api.js',async original=>({...await original<typeof import('../../src/workflow-api.js')>(),getWorkflow:vi.fn(),changeWorkflow:vi.fn()}));
const user={id:7,name:'Iris',email:'iris@example.test',role:'IT_STAFF' as const,mustChangePassword:false};
const data:api.WorkflowState={ticket:{id:41,currentStatus:'OPEN',version:2,lastResolvedAt:null},eligibility:{allowedTransitions:['IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],resolutionReasons:[],cancelBlocked:false},items:[]};
beforeEach(()=>{vi.mocked(api.getWorkflow).mockResolvedValue(data);vi.mocked(api.changeWorkflow).mockResolvedValue({id:41,currentStatus:'IN_PROGRESS',version:3} as any);});
afterEach(()=>vi.clearAllMocks());
async function choose(status='IN_PROGRESS'){await screen.findByLabelText('New Ticket status');await userEvent.selectOptions(screen.getByLabelText('New Ticket status'),status);}
describe('Final Ticket workflow UI',()=>{
  it('makes Requester history read-only and uses owned routes only',async()=>{
    render(<TicketWorkflow ticketId={41} user={{...user,role:'REQUESTER'}}/>);
    await screen.findByText('Requester access is read-only. An indication never resolves or closes the Ticket.');
    expect(screen.queryByLabelText('New Ticket status')).not.toBeInTheDocument();expect(api.getWorkflow).toHaveBeenCalledWith(41,true);
  });
  it('blocks Resolve with explicit missing work/follow-up reasons without sending a write',async()=>{
    vi.mocked(api.getWorkflow).mockResolvedValue({...data,eligibility:{...data.eligibility,resolutionReasons:['NO_COMPLETED_ACTION','OPEN_ACTIONS','FOLLOW_UP_PENDING']}});
    render(<TicketWorkflow ticketId={41} user={user}/>);await choose('RESOLVED');
    expect(screen.getByRole('button',{name:'Review transition'})).toBeDisabled();expect(screen.getByText('Record and complete at least one Action.')).toBeInTheDocument();expect(api.changeWorkflow).not.toHaveBeenCalled();
  });
  it('offers only matrix destinations and requires explicit keyboard-focusable confirmation for Administrator',async()=>{
    render(<TicketWorkflow ticketId={41} user={{...user,role:'ADMINISTRATOR'}}/>);await choose();
    expect(within(screen.getByLabelText('New Ticket status')).queryByRole('option',{name:'Closed'})).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button',{name:'Review transition'}));expect(screen.getByRole('heading',{name:'Confirm Open → In Progress?'})).toHaveFocus();
    expect(api.changeWorkflow).not.toHaveBeenCalled();await userEvent.click(screen.getByRole('button',{name:'Confirm transition'}));await screen.findByText('Ticket status saved.');expect(api.changeWorkflow).toHaveBeenCalledWith(41,'IN_PROGRESS',2);
  });
  it('preserves a failed selection and version through recoverable503',async()=>{
    vi.mocked(api.changeWorkflow).mockRejectedValue(new api.WorkflowError(503,'FAILED'));
    render(<TicketWorkflow ticketId={41} user={user}/>);await choose();await userEvent.click(screen.getByRole('button',{name:'Review transition'}));await userEvent.click(screen.getByRole('button',{name:'Confirm transition'}));
    await screen.findByRole('alert');expect(screen.getByLabelText('New Ticket status')).toHaveValue('IN_PROGRESS');expect(screen.getByText(/based on version 2/)).toBeInTheDocument();
  });
  it('requires an actual refresh and deliberate version adoption after409',async()=>{
    vi.mocked(api.changeWorkflow).mockRejectedValue(new api.WorkflowError(409,'STALE_VERSION'));
    render(<TicketWorkflow ticketId={41} user={user}/>);await screen.findByLabelText('New Ticket status');await userEvent.click(screen.getByRole('button',{name:'Refresh workflow'}));await choose();await userEvent.click(screen.getByRole('button',{name:'Review transition'}));await userEvent.click(screen.getByRole('button',{name:'Confirm transition'}));await screen.findByRole('alert');
    expect(screen.queryByRole('button',{name:'Use latest version for this selection'})).not.toBeInTheDocument();
    vi.mocked(api.getWorkflow).mockResolvedValue({...data,ticket:{...data.ticket,version:4}});
    await userEvent.click(screen.getByRole('button',{name:'Refresh workflow'}));expect(await screen.findByText(/based on version 2/)).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button',{name:'Use latest version for this selection'}));expect(screen.getByText(/based on version 4/)).toBeInTheDocument();expect(api.changeWorkflow).toHaveBeenCalledTimes(1);
  });
  it('retains selection but disables writes when refreshed saved status makes it illegal',async()=>{
    const {rerender}=render(<TicketWorkflow ticketId={41} user={user} version={2}/>);await choose('RESOLVED');
    vi.mocked(api.getWorkflow).mockResolvedValue({...data,ticket:{...data.ticket,currentStatus:'RESOLVED',version:3},eligibility:{...data.eligibility,allowedTransitions:['CLOSED','REOPENED']}});
    rerender(<TicketWorkflow ticketId={41} user={user} version={3}/>);await screen.findByText('Resolved — no longer allowed');
    expect(screen.getByRole('button',{name:'Review transition'})).toBeDisabled();expect(screen.queryByRole('button',{name:'Use latest version for this selection'})).not.toBeInTheDocument();
  });
  it('prevents double submits while status update is pending',async()=>{
    let finish!:(x:any)=>void;vi.mocked(api.changeWorkflow).mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));render(<TicketWorkflow ticketId={41} user={user}/>);await choose();await userEvent.click(screen.getByRole('button',{name:'Review transition'}));await userEvent.dblClick(screen.getByRole('button',{name:'Confirm transition'}));expect(api.changeWorkflow).toHaveBeenCalledTimes(1);finish({id:41,version:3,currentStatus:'IN_PROGRESS'});await screen.findByText('Ticket status saved.');
  });
  it('does not invent legacy history and permits only Reopened from Closed',async()=>{
    vi.mocked(api.getWorkflow).mockResolvedValue({...data,ticket:{...data.ticket,currentStatus:'CLOSED'},eligibility:{...data.eligibility,allowedTransitions:['REOPENED']}});render(<TicketWorkflow ticketId={41} user={user}/>);await choose('REOPENED');expect(screen.getByText('No recorded transitions. Legacy status is not reconstructed.')).toBeInTheDocument();expect(screen.getByText(/Unknown \/ not recorded/)).toBeInTheDocument();
  });
  it('fails closed on forbidden/not-found and allows safe retry',async()=>{
    vi.mocked(api.getWorkflow).mockRejectedValueOnce(new api.WorkflowError(403,'FORBIDDEN'));render(<TicketWorkflow ticketId={41} user={user}/>);expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission');expect(screen.queryByLabelText('New Ticket status')).not.toBeInTheDocument();await userEvent.click(screen.getByRole('button',{name:'Retry workflow'}));await screen.findByLabelText('New Ticket status');
  });
});
