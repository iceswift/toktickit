import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
import { Dashboard } from '../../src/Dashboard.js';
import { dashboardDestination,getDashboard } from '../../src/dashboard-api.js';
const data={asOf:'2026-10-29T17:00:00Z',timeZone:'Asia/Bangkok',resolvedWindow:{start:'2026-10-23T17:00:00Z',end:'2026-10-29T17:00:00Z'},metrics:{openTickets:0,waitingTickets:0,recentlyResolvedTickets:0},recentTickets:[],attentionTickets:[],drillDown:{openTickets:'/api/tickets?statusGroup=open',waitingTickets:'/api/tickets?status=WAITING_FOR_REQUESTER',recentlyResolvedTickets:'/api/tickets?statusGroup=resolved&resolvedSince=2026-10-23T17%3A00%3A00Z&resolvedBefore=2026-10-29T17%3A00%3A00Z'}};
const user={id:7,name:'Synthetic Owner',email:'owner@example.test',role:'REQUESTER' as const,mustChangePassword:false,isActive:true};
beforeEach(()=>vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>structuredClone(data)})));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('Dashboard UI and safe drill-down',()=>{
  it('shows loading, then numeric zeros and explicit empty lists',async()=>{
    render(<Dashboard user={user} onOpenTicket={vi.fn()} onDrillDown={vi.fn()}/>);
    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard');
    expect(await screen.findByText(/Asia\/Bangkok · Backend snapshot/)).toBeVisible();
    expect(screen.getAllByText('0')).toHaveLength(3);expect(screen.getAllByText('No Tickets in this section.')).toHaveLength(2);
  });
  it('passes the exact owned status-group predicate to the list',async()=>{
    const drill=vi.fn();render(<Dashboard user={user} onOpenTicket={vi.fn()} onDrillDown={drill}/>);
    fireEvent.click(await screen.findByRole('button',{name:/Open Tickets 0/}));
    expect(drill).toHaveBeenCalledWith({kind:'requester',query:{statusGroup:'open'}},'Open Tickets');
  });
  it('shows safe failure rather than fabricated zero totals; retries successfully',async()=>{
    vi.mocked(fetch).mockResolvedValueOnce({ok:false,status:500,json:async()=>({error:'SECRET'})} as Response);
    render(<Dashboard user={user} onOpenTicket={vi.fn()} onDrillDown={vi.fn()}/>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load dashboard data');expect(screen.queryByText('0')).toBeNull();expect(screen.queryByText('SECRET')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Retry dashboard'}));await screen.findByText(/Asia\/Bangkok · Backend snapshot/);
  });
  it('refreshes the snapshot after a new server response',async()=>{
    render(<Dashboard user={user} onOpenTicket={vi.fn()} onDrillDown={vi.fn()}/>);await screen.findByText(/Asia\/Bangkok · Backend snapshot/);
    vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({...data,metrics:{...data.metrics,openTickets:3}})} as Response);
    fireEvent.click(screen.getByRole('button',{name:'Refresh dashboard'}));await screen.findByRole('button',{name:/Open Tickets 3/});
  });
  it.each([401,403])('does not leak counts when access is rejected (%s)',async status=>{
    vi.mocked(fetch).mockResolvedValueOnce({ok:false,status} as Response);await expect(getDashboard(true)).rejects.toThrow(status===401?'session has expired':'permission');
  });
  it.each(['https://evil.test/api/tickets','//evil.test/api/tickets','/staff/tickets?status=OPEN','/api/tickets?ownerId=5','/api/tickets?status=OPEN&status=CLOSED','/api/tickets#secret'])('rejects unsafe requester destination %s',path=>expect(()=>dashboardDestination(path,true)).toThrow());
  it('maps staff owner, priority and current-performer work without dropping filters',()=>{
    expect(dashboardDestination('/staff/tickets?statusGroup=open&ownerId=7',false)).toEqual({kind:'staff',query:{statusGroup:'open',ownerId:7}});
    expect(dashboardDestination('/staff/tickets?statusGroup=open&priority=URGENT',false)).toEqual({kind:'staff',query:{statusGroup:'open',itPriority:'URGENT'}});
    expect(dashboardDestination('/staff/actions?performedBy=me',false)).toEqual({kind:'actions'});
  });
  it('rejects malformed totals rather than displaying partial data',async()=>{
    vi.mocked(fetch).mockResolvedValueOnce({ok:true,json:async()=>({...data,metrics:{...data.metrics,openTickets:-1}})} as Response);await expect(getDashboard(true)).rejects.toThrow('Unable to load');
  });
});
