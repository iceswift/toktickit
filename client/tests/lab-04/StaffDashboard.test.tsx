import { render,screen,fireEvent,cleanup } from '@testing-library/react';
import { afterEach,it,expect,vi } from 'vitest';
import { Dashboard } from '../../src/Dashboard.js';
import { ticketStates,itPriorities } from '../../src/dashboard-api.js';
const user={id:9,name:'Synthetic Staff',email:'staff@example.test',role:'IT_STAFF' as const,mustChangePassword:false};
function response(){return {asOf:'2026-10-30T05:00:00Z',timeZone:'Asia/Bangkok',metrics:{unassignedOpenTickets:2,myOpenTickets:1,myActions:3,ticketsByStatus:Object.fromEntries(ticketStates.map(k=>[k,0])),openTicketsByPriority:Object.fromEntries(itPriorities.map(k=>[k,0]))},recentTickets:[],urgentTickets:[],recentMyActions:[],drillDown:{unassignedOpenTickets:'/staff/tickets?statusGroup=open&unassigned=true',myOpenTickets:'/staff/tickets?statusGroup=open&ownerId=9',myActions:'/staff/actions?performedBy=me',ticketsByStatus:Object.fromEntries(ticketStates.map(k=>[k,'/staff/tickets?status='+k])),openTicketsByPriority:Object.fromEntries(itPriorities.map(k=>[k,'/staff/tickets?statusGroup=open&priority='+k]))}};}
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it.each(['IT_STAFF','ADMINISTRATOR'] as const)('shows correct %s heading and zero enum buckets',async role=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>response()}));render(<Dashboard user={{...user,role}} onOpenTicket={vi.fn()} onDrillDown={vi.fn()}/>);
  expect(await screen.findByRole('button',{name:'Cancelled: 0'})).toBeVisible();expect(screen.getByRole('button',{name:'Urgent: 0'})).toBeVisible();expect(screen.getByRole('heading',{name:role==='IT_STAFF'?'IT Staff Dashboard':'Administrator Dashboard'})).toBeVisible();
});
it('carries session-owner drill-down and current-performer My Actions as distinct populations',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>response()}));const drill=vi.fn();render(<Dashboard user={user} onOpenTicket={vi.fn()} onDrillDown={drill}/>);
  fireEvent.click(await screen.findByRole('button',{name:/My Open Tickets 1/}));expect(drill).toHaveBeenLastCalledWith({kind:'staff',query:{statusGroup:'open',ownerId:9}},'My Open Tickets');
  fireEvent.click(screen.getByRole('button',{name:/My Actions 3/}));expect(drill).toHaveBeenLastCalledWith({kind:'actions'},'My Actions');expect(screen.getByText(/Performed by you, not merely assigned/)).toBeVisible();
});
it('does not show cached operational totals on forbidden response',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403}));render(<Dashboard user={user} onOpenTicket={vi.fn()} onDrillDown={vi.fn()}/>);expect(await screen.findByRole('alert')).toHaveTextContent('permission');expect(screen.queryByRole('button',{name:/Unassigned Open \d/})).toBeNull();});
