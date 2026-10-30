import { render,screen,fireEvent,cleanup } from '@testing-library/react';
import { afterEach,it,expect,vi } from 'vitest';
import * as api from '../../src/api.js';
import App from '../../src/App.js';
vi.mock('../../src/MyTickets.js',()=>({MyTickets:()=> <h1>My Tickets</h1>}));
vi.mock('../../src/CreateTicketForm.js',()=>({CreateTicketForm:()=> <h1>Create Ticket</h1>}));
vi.mock('../../src/Dashboard.js',()=>({Dashboard:()=> <h1>Requester Dashboard</h1>,MyActions:()=> <h1>My Actions</h1>}));
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('exposes exactly one current-page navigation action and follows user navigation',async()=>{
  vi.spyOn(api,'getCurrentUser').mockResolvedValue({id:1,name:'Owner',email:'owner@example.test',role:'REQUESTER',mustChangePassword:false});render(<App/>);await screen.findByRole('heading',{name:'My Tickets'});
  const nav=screen.getByRole('navigation',{name:'Application navigation'});expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);expect(screen.getByRole('button',{name:'My Tickets'})).toHaveAttribute('aria-current','page');
  for(const name of ['Dashboard','Create Ticket','My Tickets']){fireEvent.click(screen.getByRole('button',{name}));expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);expect(screen.getByRole('button',{name})).toHaveAttribute('aria-current','page');}
});
