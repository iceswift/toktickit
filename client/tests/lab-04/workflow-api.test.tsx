import { afterEach, describe, expect, it, vi } from 'vitest';
import { changeWorkflow, getWorkflow, WorkflowError } from '../../src/workflow-api.js';
afterEach(()=>vi.unstubAllGlobals());
describe('Ticket workflow adapter',()=>{
  it('sends an exact versioned status body with credentials',async()=>{
    const fn=vi.fn().mockResolvedValue(new Response('{"id":41,"version":3,"currentStatus":"IN_PROGRESS"}'));vi.stubGlobal('fetch',fn);await changeWorkflow(41,'IN_PROGRESS',2);expect(fn.mock.calls[0][0]).toContain('/staff/tickets/41/status');expect(fn.mock.calls[0][1].credentials).toBe('include');expect(JSON.parse(fn.mock.calls[0][1].body)).toEqual({status:'IN_PROGRESS',expectedVersion:2});
  });
  it('uses the owned Requester history route and rejects malformed successful snapshots',async()=>{
    const fn=vi.fn().mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',fn);await expect(getWorkflow(41,true)).rejects.toMatchObject({code:'INVALID_RESPONSE'});expect(fn.mock.calls[0][0]).toContain('/api/tickets/41/workflow-events');
  });
  it.each([401,403,404,409,503])('preserves status%s without disclosing private server errors',async status=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{"error":"PRIVATE-STACK-SENTINEL","code":"SAFE_CODE","fields":{"reason":"OPEN_ACTIONS"}}',{status})));
    try{await changeWorkflow(41,'RESOLVED',2);throw new Error('Expected failure');}catch(e){expect(e).toBeInstanceOf(WorkflowError);expect(e).toMatchObject({status,code:'SAFE_CODE',reason:'OPEN_ACTIONS'});expect((e as Error).message).not.toContain('PRIVATE');}
  });
});
