import { test,expect,type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync,writeFileSync } from 'node:fs';
import { resetAccount,runDatabase,signIn,expectNoHorizontalOverflow } from '../lab-03/helpers.js';
import { assertSyntheticDatabase } from '../test-environment.js';
const shots='../output/playwright/phase7/visual',api='http://127.0.0.1:55485';
const owner='amina.rahman@example.test',staff='iris.nattapong@example.test',admin='narin.admin@example.test';
let ticketNumber:string;
const browserErrors=new WeakMap<Page,{message:string;url:string}[]>();
test.beforeEach(({page})=>{const errors:{message:string;url:string}[]=[];browserErrors.set(page,errors);page.on('pageerror',e=>errors.push({message:e.message,url:'runtime'}));page.on('console',message=>{if(message.type()==='error')errors.push({message:message.text(),url:message.location().url});});});
test.afterEach(({page},info)=>{
  const errors=browserErrors.get(page)??[];
  const expected=(entry:{message:string;url:string})=>
    (entry.url===api+'/auth/me'&&/^Failed to load resource:.*401/.test(entry.message))||
    (info.title.startsWith('real Staff draft')&&/^http:\/\/127\.0\.0\.1:55485\/staff\/tickets\/\d+\/internal-notes$/.test(entry.url)&&/^Failed to load resource:.*503/.test(entry.message));
  const unexpected=errors.filter(entry=>!expected(entry));
  writeFileSync(shots+'/'+info.title.replace(/[^a-zA-Z0-9]+/g,'-')+'-console.json',JSON.stringify({title:info.title,expected:errors.filter(expected),unexpected},null,2));
  expect(unexpected,'unexpected browser runtime/console errors').toEqual([]);
});
test.beforeAll(()=>{assertSyntheticDatabase();mkdirSync(shots,{recursive:true});for(const email of [owner,staff,admin])resetAccount(email);ticketNumber='TKT-P7-VISUAL-'+Date.now();runDatabase(`const u=await p.user.findUniqueOrThrow({where:{email:'${owner}'}});const s=await p.user.findUniqueOrThrow({where:{email:'${staff}'}});const c=await p.category.findFirstOrThrow();const r=await p.relatedSystem.findFirstOrThrow();const t=await p.ticket.create({data:{ticketNumber:'${ticketNumber}',requesterId:u.developmentRequesterId,requesterUserId:u.id,categoryId:c.id,relatedSystemId:r.id,summary:'Phase7 accessible service workflow',description:'Synthetic fixture for loaded visual and keyboard inspection. '+ 'long-unbroken-'.repeat(15),requestedPriority:'HIGH',currentStatus:'OPEN',itPriority:'URGENT',version:2,createdAt:new Date(Date.now()-86400000)}});const a=await p.actionTaken.create({data:{ticketId:t.id,performedByUserId:s.id,assigneeUserId:s.id,actionDateTime:new Date(),description:'Review VPN connectivity; retain clear work history.',result:'Waiting for user confirmation',followUpRequired:true,followUpNote:'Confirm connection',attachmentNotes:'Look for the diagnostic screenshot'}});await p.actionEvent.create({data:{actionId:a.id,ticketId:t.id,actorId:s.id,type:'CREATED',version:1,changes:{syntheticVisualFixture:true}}});`);});
async function inspect(page:Page,name:string){
  await expectNoHorizontalOverflow(page);
  const broken=await page.locator('img').evaluateAll(images=>images.filter((img)=>!(img as HTMLImageElement).complete||(img as HTMLImageElement).naturalWidth===0).length);expect(broken).toBe(0);
  const badLinks=await page.locator('a[href]').evaluateAll(links=>links.filter(a=>['#','javascript:void(0)'].includes(a.getAttribute('href')??'')).map(a=>a.textContent));expect(badLinks).toEqual([]);
  await page.screenshot({path:shots+'/'+name+'.png',fullPage:true,animations:'disabled'});
  // Preserve the full page above; readable report panels are additional captures,
  // never a replacement for the loaded surrounding context.
  if(/^action-(validation|edit|history)-/.test(name))await page.getByRole('region',{name:'Actions Taken',exact:true}).screenshot({path:shots+'/'+name+'-panel.png',animations:'disabled'});
  if(name.startsWith('workflow-confirm-'))await page.getByRole('region',{name:'Ticket Workflow',exact:true}).screenshot({path:shots+'/'+name+'-panel.png',animations:'disabled'});
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  writeFileSync(shots+'/'+name+'-axe.json',JSON.stringify({name,url:page.url(),violations:audit.violations,incomplete:audit.incomplete,passes:audit.passes.map(x=>x.id)},null,2));
  expect(audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,failure:n.failureSummary}))}))).toEqual([]);
}
async function openDetail(page:Page,requester=false){await page.getByLabel('Search',{exact:true}).fill(ticketNumber);await page.getByRole('button',{name:requester?'View details':'Open detail',exact:true}).click();await expect(page.getByRole('heading',{name:ticketNumber,exact:true})).toBeVisible();await expect(page.getByText('Loading Actions...',{exact:true})).toHaveCount(0);await expect(page.getByText('Loading Ticket workflow...',{exact:true})).toHaveCount(0);}
for(const [size,width,height]of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]] as const){
  test('Requester screens: loaded semantic/contrast/keyboard inspection at '+size,async({page})=>{
    await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{name:'Sign in'})).toBeVisible();await inspect(page,'login-'+size);
    await page.getByLabel('Email').focus();await page.keyboard.press('Tab');await expect(page.getByLabel('Password',{exact:true})).toBeFocused();
    await signIn(page,owner);await expect(page.getByRole('heading',{name:'My Tickets'})).toBeVisible();await inspect(page,'my-tickets-'+size);
    await page.getByRole('button',{name:'Dashboard',exact:true}).click();await expect(page.getByText(/Asia\/Bangkok · Backend snapshot/)).toBeVisible();await inspect(page,'requester-dashboard-'+size);
    await page.getByRole('button',{name:'Create Ticket',exact:true}).click();await expect(page.getByRole('heading',{name:'Create Ticket'})).toBeVisible();await expect(page.getByLabel('Category *')).toBeEnabled();await inspect(page,'create-ticket-'+size);
    await page.getByRole('navigation',{name:'Application navigation'}).getByRole('button',{name:'My Tickets'}).click();await openDetail(page,true);await expect(page.getByRole('region',{name:'Ticket Workflow',exact:true}).getByText(/Requester access is read-only/)).toBeVisible();await inspect(page,'requester-detail-'+size);expect(errors).toEqual([]);
  });
  test('Staff work forms, confirmations and My Actions inspection at '+size,async({page})=>{
    await page.setViewportSize({width,height});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await signIn(page,staff);await expect(page.getByRole('heading',{name:'Ticket Queue'})).toBeVisible();await inspect(page,'staff-queue-'+size);
    await page.getByRole('button',{name:'Dashboard',exact:true}).click();await expect(page.getByText(/Asia\/Bangkok · Backend snapshot/)).toBeVisible();await inspect(page,'staff-dashboard-'+size);
    await page.getByRole('navigation',{name:'Application navigation'}).getByRole('button',{name:'My Actions',exact:true}).click();await expect(page.getByText(/\d+ recorded Actions\./)).toBeVisible();await inspect(page,'my-actions-'+size);
    await page.getByRole('button',{name:'Ticket Queue',exact:true}).click();await openDetail(page);await inspect(page,'staff-detail-'+size);
    const workflow=page.getByRole('region',{name:'Ticket Workflow',exact:true});await workflow.getByLabel('New Ticket status').selectOption('IN_PROGRESS');await workflow.getByRole('button',{name:'Review transition'}).click();await expect(workflow.getByRole('heading',{name:'Confirm Open → In Progress?'})).toBeFocused();await page.keyboard.press('Tab');await expect(workflow.getByRole('button',{name:'Confirm transition',exact:true})).toBeFocused();await inspect(page,'workflow-confirm-'+size);await workflow.getByRole('button',{name:'Keep current Ticket status'}).click();
    await page.getByRole('button',{name:'Record an Action',exact:true}).click();await expect(page.getByLabel('Assigned to',{exact:true})).toBeEnabled();await page.getByLabel('Follow-up required',{exact:true}).check();await page.getByRole('button',{name:'Save Action',exact:true}).click();await expect(page.getByLabel('Action description')).toHaveAttribute('aria-invalid','true');await inspect(page,'action-validation-'+size);await page.getByRole('button',{name:'Discard draft'}).click();
    await page.getByRole('button',{name:'Edit Action',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Edit Action',exact:true})).toBeFocused();await inspect(page,'action-edit-'+size);await page.getByRole('button',{name:'Discard draft'}).click();
    await page.getByRole('button',{name:'View history',exact:true}).first().click();await expect(page.getByRole('region',{name:/Action.*history/})).toBeVisible();await inspect(page,'action-history-'+size);expect(errors).toEqual([]);
  });
  test('Administrator directory and edit/reset forms inspection at '+size,async({page})=>{
    await page.setViewportSize({width,height});await signIn(page,admin);await expect(page.getByRole('heading',{name:'User Management'})).toBeVisible();await inspect(page,'admin-directory-'+size);
    await page.getByLabel('Search users').fill(staff);const row=page.locator('tr,article').filter({hasText:staff}).filter({visible:true}).first();await row.getByRole('button',{name:'Edit',exact:true}).click();await expect(page.getByRole('heading',{name:/Edit Iris/})).toBeVisible();await inspect(page,'admin-edit-'+size);await page.getByRole('button',{name:'Cancel editing'}).click();
    await row.getByRole('button',{name:'Reset password',exact:true}).click();await expect(page.getByLabel('New initial password')).toBeVisible();await inspect(page,'admin-reset-'+size); // Inspect only, never submit a credential change.
  });
}
test('real Staff draft survives a labelled injected failure and is posted once after retry',async({page})=>{await signIn(page,staff);await expect(page.getByRole('heading',{name:'Ticket Queue'})).toBeVisible();await openDetail(page);await page.getByLabel('Add Internal Note').fill('Retained Phase7 note draft');await page.route('**/staff/tickets/*/internal-notes',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Temporary test failure"}'}));await page.getByRole('button',{name:'Save Internal Note'}).click();await expect(page.getByLabel('Add Internal Note')).toHaveValue('Retained Phase7 note draft');await page.screenshot({path:shots+'/injected-note-failure.png',fullPage:true});await page.unroute('**/staff/tickets/*/internal-notes');await page.getByRole('button',{name:'Save Internal Note'}).click();await expect(page.getByLabel('Add Internal Note')).toHaveValue('');await expect(page.getByText('Retained Phase7 note draft',{exact:true})).toHaveCount(1);});
