import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionRequestError, getActions, getActionEvents, createAction } from '../../src/actions-api.js';
afterEach(()=>vi.unstubAllGlobals());
describe('Action HTTP adapter',()=>{
  it('uses only owned Requester routes and includes the session cookie',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[],page:1,pageSize:10,totalItems:0,totalPages:1})));
    vi.stubGlobal('fetch',fetcher);await getActions(41,true);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/api/tickets/41/actions?'),expect.objectContaining({credentials:'include',method:'GET'}));
  });
  it('sends the same explicitly supplied creation key in the header, not spoofed identity',async()=>{
    const fetcher=vi.fn().mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',fetcher);
    await expect(createAction(41,{actionDateTime:'2026-10-28T02:00:00Z',description:'Work',result:'',assigneeUserId:8,followUpRequired:false,followUpNote:'',attachmentNotes:'',expectedTicketVersion:2},'logical-key-123')).rejects.toMatchObject({code:'INVALID_RESPONSE'});
    expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe('logical-key-123');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).not.toHaveProperty('performedByUserId');
  });
  it('rejects malformed list items rather than crashing the rendered UI',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({items:[{}],page:1,pageSize:10,totalItems:1,totalPages:1}))));
    await expect(getActions(41,false)).rejects.toMatchObject({code:'INVALID_RESPONSE'});
  });
  it('rejects malformed history safely',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{"items":[null]}')));
    await expect(getActionEvents(41,1,true)).rejects.toMatchObject({code:'INVALID_RESPONSE'});
  });
  it.each([401,403,404,409,503])('preserves status %s without exposing server diagnostic text',async status=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('{"error":"secret diagnostic","code":"SAFE_CODE"}',{status})));
    try{await getActions(41,false);throw new Error('expected failure');}catch(error){expect(error).toBeInstanceOf(ActionRequestError);expect(error).toMatchObject({status,code:'SAFE_CODE'});expect((error as Error).message).not.toContain('secret');}
  });
});
