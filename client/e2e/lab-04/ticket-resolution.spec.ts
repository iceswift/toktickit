import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resetAccount, runDatabase, signIn, expectNoHorizontalOverflow } from '../lab-03/helpers.js';
const api='http://127.0.0.1:55485',staff='iris.nattapong@example.test',admin='narin.admin@example.test',owner='amina.rahman@example.test';
const shots='../output/playwright/phase5';let number:string;
test.beforeAll(()=>{const u=new URL(process.env.DATABASE_URL??'http://invalid');if(process.env.LAB4_UI_TEST!=='1'||u.hostname!=='127.0.0.1'||u.port!=='55484'||!/^\/lab4_p[456]_ui_[a-z0-9_]+$/.test(u.pathname))throw new Error('Unsafe test DB');mkdirSync(shots,{recursive:true});for(const email of [staff,admin,owner])resetAccount(email);});
test.beforeEach(()=>{number=`TKT-P5-${Date.now()}-${test.info().testId.slice(-5)}`;runDatabase(`const u=await p.user.findUniqueOrThrow({where:{email:'${owner}'}});const c=await p.category.findFirstOrThrow();const r=await p.relatedSystem.findFirstOrThrow();await p.ticket.create({data:{ticketNumber:'${number}',requesterId:u.developmentRequesterId,requesterUserId:u.id,categoryId:c.id,relatedSystemId:r.id,summary:'Phase 5 synthetic workflow',description:'Synthetic workflow acceptance; no service data.',requestedPriority:'MEDIUM',currentStatus:'OPEN',createdAt:new Date(Date.now()-3600000)}});`);});
async function open(page:Page,email=staff){await signIn(page,email);if(email===admin)await page.getByRole('button',{name:'Ticket Queue',exact:true}).click();await page.getByLabel('Search',{exact:true}).fill(number);await expect(page.getByRole('cell',{name:number,exact:true})).toBeVisible();await page.getByRole('button',{name:email===owner?'View details':'Open detail',exact:true}).first().click();await expect(panel(page).getByText('Loading Ticket workflow...')).not.toBeVisible();await expect(panel(page).getByText('Current status:',{exact:false})).toBeVisible();}
const panel=(page:Page)=>page.getByRole('region',{name:'Ticket Workflow',exact:true});
async function shot(page:Page,name:string){await panel(page).screenshot({path:`${shots}/${name}.png`});}
async function transition(page:Page,status:string){await panel(page).getByLabel('New Ticket status').selectOption(status);await panel(page).getByRole('button',{name:'Review transition'}).click();await panel(page).getByRole('button',{name:'Confirm transition',exact:true}).click();await expect(panel(page).getByText('Ticket status saved.',{exact:true})).toBeVisible();await expect(panel(page).getByText('Loading Ticket workflow...')).not.toBeVisible();}
async function id(page:Page){const r=await page.request.get(`${api}/staff/tickets?search=${number}`);return (await r.json()).items[0].id as number;}

test('real work gate then Resolve, Close, Administrator Reopen and Cancel with ordered history',async({page,browser})=>{
  await open(page);await panel(page).getByLabel('New Ticket status').selectOption('RESOLVED');await expect(panel(page).getByRole('button',{name:'Review transition'})).toBeDisabled();await shot(page,'no-completed-gate');
  const tid=await id(page);const denied=await page.request.patch(`${api}/staff/tickets/${tid}/status`,{data:{status:'RESOLVED',expectedVersion:1}});expect(denied.status()).toBe(409);expect((await denied.json()).fields.reason).toBe('NO_COMPLETED_ACTION');
  await page.getByRole('button',{name:'Record an Action',exact:true}).click();await page.getByLabel('Action description').fill('Repair performed for resolution');await page.getByLabel('Result',{exact:true}).fill('Connection verified');await page.getByLabel('Follow-up required',{exact:true}).check();await page.getByLabel('Follow-up note',{exact:true}).fill('Confirm requester acceptance');await page.getByRole('button',{name:'Save Action',exact:true}).click();await expect(page.getByText('Action saved.',{exact:true})).toBeVisible();
  await expect(panel(page).getByText('Complete or cancel every Planned / In Progress Action.')).toBeVisible();await shot(page,'open-actions-gate');
  await page.getByRole('button',{name:'Start Action',exact:true}).click();await page.getByRole('button',{name:'Confirm In Progress',exact:true}).click();await expect(page.getByRole('button',{name:'Complete Action',exact:true})).toBeVisible();await page.getByRole('button',{name:'Complete Action',exact:true}).click();await page.getByRole('button',{name:'Confirm Completed',exact:true}).click();
  await expect(panel(page).getByText('Clear outstanding follow-up through an audited Action edit.')).toBeVisible();await panel(page).getByLabel('New Ticket status').selectOption('RESOLVED');await expect(panel(page).getByRole('button',{name:'Review transition'})).toBeDisabled();await shot(page,'follow-up-gate');
  await page.getByRole('button',{name:'Edit Action',exact:true}).click();await page.getByLabel('Follow-up required',{exact:true}).uncheck();await page.getByRole('button',{name:'Save Action',exact:true}).click();await expect(panel(page).getByText(/Work and follow-up requirements satisfied/)).toBeVisible();
  await transition(page,'RESOLVED');await shot(page,'resolved');await expect(page.getByRole('button',{name:'Record an Action',exact:true})).toHaveCount(0);
  await transition(page,'CLOSED');await shot(page,'closed-history');
  const ctx=await browser.newContext();const administrator=await ctx.newPage();await open(administrator,admin);await transition(administrator,'REOPENED');await shot(administrator,'administrator-reopened');await transition(administrator,'CANCELLED');await expect(panel(administrator).getByText(/No further transitions are allowed from Cancelled/)).toBeVisible();await shot(administrator,'cancelled-history');await ctx.close();
});

test('Requester indication remains advisory; own history read-only and formal API403',async({page})=>{
  await open(page,owner);await page.getByRole('button',{name:'Mark problem as appearing resolved',exact:true}).click();await expect(page.getByRole('button',{name:'Clear indication',exact:true})).toBeVisible();await expect(panel(page).getByText('Current status:',{exact:false})).toContainText('Open');await expect(panel(page).getByLabel('New Ticket status')).toHaveCount(0);await shot(page,'requester-advisory');
  await page.getByRole('heading',{name:'Problem appears resolved',exact:true}).locator('..').locator('..').screenshot({path:`${shots}/requester-indication.png`});
  const tickets=await page.request.get(`${api}/api/tickets?search=${number}`),tid=(await tickets.json()).items[0].id;expect((await page.request.patch(`${api}/staff/tickets/${tid}/status`,{data:{status:'RESOLVED',expectedVersion:1}})).status()).toBe(403);
});

test('real competing Ticket write409 preserves selection until refresh and explicit rebase',async({page})=>{
  await open(page);await panel(page).getByLabel('New Ticket status').selectOption('IN_PROGRESS');const tid=await id(page);expect((await page.request.patch(`${api}/staff/tickets/${tid}/status`,{data:{status:'WAITING_FOR_REQUESTER',expectedVersion:1}})).status()).toBe(200);
  await panel(page).getByRole('button',{name:'Review transition'}).click();await panel(page).getByRole('button',{name:'Confirm transition',exact:true}).click();await expect(panel(page).getByRole('alert')).toContainText('Refresh');await shot(page,'stale-conflict');await expect(panel(page).getByRole('button',{name:'Use latest version for this selection'})).toHaveCount(0);
  await panel(page).getByRole('button',{name:'Refresh workflow'}).click();await expect(panel(page).getByText(/based on version 1/)).toBeVisible();await panel(page).getByRole('button',{name:'Use latest version for this selection'}).click();await panel(page).getByRole('button',{name:'Review transition'}).click();await panel(page).getByRole('button',{name:'Confirm transition',exact:true}).click();await expect(panel(page).getByText('Ticket status saved.')).toBeVisible();await shot(page,'reconciled-history');
});

test('injected recoverable failure retains selection/version and succeeds on deliberate retry',async({page})=>{
  await open(page);let blocked=true;await page.route('**/staff/tickets/*/status',async route=>{if(blocked){blocked=false;await route.fulfill({status:503,contentType:'application/json',body:'{"code":"INJECTED_FAILURE"}'});}else await route.continue();});
  await panel(page).getByLabel('New Ticket status').selectOption('IN_PROGRESS');await panel(page).getByRole('button',{name:'Review transition'}).click();await panel(page).getByRole('button',{name:'Confirm transition',exact:true}).click();await expect(panel(page).getByRole('alert')).toContainText('selection is retained');await expect(panel(page).getByLabel('New Ticket status')).toHaveValue('IN_PROGRESS');await shot(page,'injected-save-failure');
  await transition(page,'IN_PROGRESS');
});

test('workflow confirmation and gate remain readable with keyboard focus at all three widths',async({page})=>{
  await open(page);await panel(page).getByLabel('New Ticket status').selectOption('IN_PROGRESS');await panel(page).getByRole('button',{name:'Review transition'}).click();await expect(panel(page).getByRole('heading',{name:'Confirm Open → In Progress?'})).toBeFocused();
  await page.keyboard.press('Tab');await expect(panel(page).getByRole('button',{name:'Confirm transition',exact:true})).toBeFocused();
  for(const [name,width,height] of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]] as const){await page.setViewportSize({width,height});await expectNoHorizontalOverflow(page);await expect(panel(page).getByRole('button',{name:'Confirm transition',exact:true})).toBeVisible();await shot(page,`confirmation-${name}`);}
});
