import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent,waitFor,cleanup } from '@testing-library/react';
import * as api from '../../src/api.js';
import { StaffTicketDetail } from '../../src/StaffTicketDetail.js';
vi.mock('../../src/ActionsTaken.js',()=>({ActionsTaken:()=>null}));
vi.mock('../../src/TicketWorkflow.js',()=>({TicketWorkflow:()=>null}));
const ticket:api.StaffTicketDetail={id:7,ticketNumber:'TKT-P7-DRAFT',requesterId:1,categoryId:1,relatedSystemId:1,summary:'Synthetic recovery',description:'No service data',requestedPriority:'MEDIUM',itPriority:'NOT_SET',currentStatus:'OPEN',version:1,createdAt:'2026-10-30T00:00:00Z',updatedAt:'2026-10-30T00:00:00Z',category:{id:1,name:'Network'},relatedSystem:{id:1,name:'VPN'},attachments:[],publicComments:[],internalNotes:[],requesterUser:{id:1,name:'Owner',email:'owner@example.test'},owner:null};
const user:api.AuthUser={id:2,name:'Staff',email:'staff@example.test',role:'IT_STAFF',mustChangePassword:false};
beforeEach(()=>{vi.spyOn(api,'getStaffTicketDetail').mockResolvedValue(ticket);vi.spyOn(api,'getStaffTicketOwners').mockResolvedValue([]);});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
describe('Staff communication draft safety',()=>{
  it.each([
    ['Add Public Comment','Post Public Comment','addStaffPublicComment'],
    ['Add Internal Note','Save Internal Note','addStaffInternalNote'],
  ] as const)('retains %s through failure then clears only after confirmed success',async(label,button,method)=>{
    const post=vi.spyOn(api,method).mockRejectedValueOnce(new api.ApiError('Unable to save. Retry safely.')).mockResolvedValueOnce({id:1,ticketId:7,content:'Keep my draft',createdAt:ticket.createdAt,author:{id:2,name:'Staff',role:'IT_STAFF'}});
    render(<StaffTicketDetail ticketId={7} user={user} onBack={vi.fn()}/>);
    const input=await screen.findByLabelText(label);fireEvent.change(input,{target:{value:'Keep my draft'}});fireEvent.click(screen.getByRole('button',{name:button}));
    await screen.findByText('Unable to save. Retry safely.');expect(input).toHaveValue('Keep my draft');
    fireEvent.click(screen.getByRole('button',{name:button}));await waitFor(()=>expect(input).toHaveValue(''));expect(post).toHaveBeenCalledTimes(2);
  });
  it('prevents repeated posts and protects input while the original request is pending',async()=>{
    let release!:(entry:api.TicketEntry)=>void;const post=vi.spyOn(api,'addStaffPublicComment').mockImplementation(()=>new Promise(resolve=>release=resolve));
    render(<StaffTicketDetail ticketId={7} user={user} onBack={vi.fn()}/>);const input=await screen.findByLabelText('Add Public Comment');fireEvent.change(input,{target:{value:'Original draft'}});
    const button=screen.getByRole('button',{name:'Post Public Comment'});fireEvent.click(button);fireEvent.click(button);expect(post).toHaveBeenCalledTimes(1);expect(input).toHaveValue('Original draft');expect(input).toBeDisabled();expect(button).toBeDisabled();
    release({id:1,ticketId:7,content:'Original draft',createdAt:ticket.createdAt,author:{id:2,name:'Staff',role:'IT_STAFF'}});await waitFor(()=>expect(input).toHaveValue(''));
  });
});
