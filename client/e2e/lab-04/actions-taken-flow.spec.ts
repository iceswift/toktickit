import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resetAccount, runDatabase, signIn, expectNoHorizontalOverflow } from '../lab-03/helpers.js';

const api = 'http://127.0.0.1:55485';
const iris = 'iris.nattapong@example.test', jonas = 'jonas.miller@example.test';
const amina = 'amina.rahman@example.test', admin = 'narin.admin@example.test';
const shots = '../output/playwright/phase4';
let number: string;
test.beforeAll(() => {
  const url = new URL(process.env.DATABASE_URL ?? 'http://invalid');
  if (process.env.LAB4_UI_TEST !== '1' || url.hostname !== '127.0.0.1' || url.port !== '55484' ||
      !/^\/lab4_p[456]_ui_[a-z0-9_]+$/.test(url.pathname)) throw new Error('Unsafe UI database');
  mkdirSync(shots, { recursive: true });
  for (const email of [iris, jonas, amina, admin]) resetAccount(email);
});
test.beforeEach(() => {
  number = `TKT-P4-${Date.now()}-${test.info().testId.slice(-5)}`;
  runDatabase(`const u=await p.user.findUniqueOrThrow({where:{email:'${amina}'}});const c=await p.category.findFirstOrThrow();const r=await p.relatedSystem.findFirstOrThrow();await p.ticket.create({data:{ticketNumber:'${number}',requesterId:u.developmentRequesterId,requesterUserId:u.id,categoryId:c.id,relatedSystemId:r.id,summary:'Phase 4 synthetic Actions UI',description:'Synthetic browser acceptance fixture; no real service work.',requestedPriority:'MEDIUM',currentStatus:'OPEN',createdAt:new Date(Date.now()-3600000)}});`);
});
// Retain fixtures/events for inspection. Never delete or bypass append-only history.
async function open(page: Page, email = iris) {
  await signIn(page, email);
  if (email === admin) await page.getByRole('button', { name: 'Ticket Queue', exact: true }).click();
  await page.getByLabel('Search', { exact: true }).fill(number);
  await expect(page.getByRole('cell', { name: number, exact: true })).toBeVisible();
  await page.getByRole('button', { name: email === amina ? 'View details' : 'Open detail', exact: true }).first().click();
  const panel = page.getByRole('heading', { name: 'Actions Taken', exact: true }).locator('..').locator('..');
  await expect(panel.getByText('Loading Actions...', { exact: true })).not.toBeVisible();
  await expect(panel.getByText('No Actions have been recorded.')).toBeVisible();
  return panel;
}
async function form(page: Page, description: string) {
  await page.getByRole('button', { name: 'Record an Action', exact: true }).click();
  await page.getByLabel('Action description', { exact: true }).fill(description);
  return page.getByRole('form', { name: 'Action form' });
}
async function save(page: Page) {
  await page.getByRole('button', { name: 'Save Action', exact: true }).click();
  await expect(page.getByText('Action saved.', { exact: true })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Action form' })).not.toBeVisible();
}
async function ticketId(page: Page) {
  const result = await page.request.get(`${api}/staff/tickets?search=${number}`);
  expect(result.ok()).toBeTruthy(); return (await result.json()).items[0].id as number;
}
async function screenshot(page: Page, name: string) {
  const panel = page.getByRole('heading', { name: 'Actions Taken', exact: true }).locator('..').locator('..');
  await panel.screenshot({ path: `${shots}/${name}.png` });
}

test('real multi-staff lifecycle: create, edit, assign, complete/cancel and owned Requester read-only history', async ({ page, browser }) => {
  await open(page); await form(page, 'Iris diagnosed the campus network');
  await page.getByLabel('Assigned to', { exact: true }).selectOption({ label: 'Jonas Miller · It Staff' });
  await page.getByLabel('Result', { exact: true }).fill('Connectivity verified'); await save(page);
  const first = page.getByRole('article').filter({ hasText: 'Iris diagnosed the campus network' });
  await expect(first.getByText('Iris Nattapong', { exact: true })).toBeVisible();
  await expect(first.getByText('Jonas Miller', { exact: true })).toBeVisible();
  await first.getByRole('button', { name: 'Edit Action', exact: true }).click();
  await page.getByLabel('Attachment notes', { exact: true }).fill('See connectivity evidence'); await save(page);
  await first.getByRole('button', { name: 'Change assignee', exact: true }).click();
  await page.getByLabel('Assigned to', { exact: true }).selectOption({ label: 'Kanya Preecha · It Staff' }); await save(page);
  await first.getByRole('button', { name: 'Start Action', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm In Progress', exact: true }).click();
  await expect(first.getByText('In Progress', { exact: true })).toBeVisible();
  await first.getByRole('button', { name: 'Complete Action', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Completed', exact: true }).click();
  await expect(first.getByText('Completed', { exact: true })).toBeVisible();
  await first.getByRole('button', { name: 'View history', exact: true }).click();
  const history = page.getByRole('region', { name: /Action .* history/ });
  await expect(history.getByText('Assigned', { exact: true })).toBeVisible();
  await expect(history.getByText('Updated', { exact: true })).toBeVisible();
  await screenshot(page, 'lifecycle-history');
  const otherContext = await browser.newContext(); const other = await otherContext.newPage();
  await signIn(other, jonas); await other.getByLabel('Search', { exact: true }).fill(number);
  await expect(other.getByRole('cell', { name: number, exact: true })).toBeVisible();
  await other.getByRole('button', { name: 'Open detail', exact: true }).first().click();
  await form(other, 'Jonas performed independent follow-up'); await save(other);
  const second = other.getByRole('article').filter({ hasText: 'Jonas performed independent follow-up' });
  await expect(second.getByText('Jonas Miller', { exact: true }).first()).toBeVisible();
  await second.getByRole('button', { name: 'Cancel Action', exact: true }).click();
  await other.getByRole('button', { name: 'Confirm Cancelled', exact: true }).click();
  await expect(second.getByText('Cancelled', { exact: true })).toBeVisible();
  await screenshot(other, 'multiple-staff');
  await otherContext.close();
  const requestContext = await browser.newContext(); const requester = await requestContext.newPage();
  await signIn(requester, amina); await requester.getByLabel('Search', { exact: true }).fill(number);
  await expect(requester.getByRole('cell', { name: number, exact: true })).toBeVisible();
  await requester.getByRole('button', { name: 'View details', exact: true }).first().click();
  await expect(requester.getByText('Jonas performed independent follow-up', { exact: true })).toBeVisible();
  await expect(requester.getByRole('button', { name: 'Record an Action', exact: true })).toHaveCount(0);
  await expect(requester.getByRole('button', { name: 'Edit Action', exact: true })).toHaveCount(0);
  await expect(requester.getByText('Internal Notes', { exact: true })).toHaveCount(0);
  await requester.getByRole('button', { name: 'View history', exact: true }).first().click();
  await expect(requester.getByRole('region', { name: /Action .* history/ })).toContainText('Created');
  await screenshot(requester, 'requester-read-only'); await requestContext.close();
});

test('uncertain transport response retains draft/key; real backend replay creates only one record', async ({ page }) => {
  await open(page); await form(page, 'Network retry proof');
  const keys: string[] = []; let dropped = false;
  await page.route('**/staff/tickets/*/actions', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    keys.push(route.request().headers()['idempotency-key']);
    const response = await route.fetch();
    if (!dropped) { dropped = true; expect(response.status()).toBe(201);
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"code":"INJECTED_LOST_RESPONSE"}' });
    } else { expect(response.status()).toBe(200); expect((await response.json()).replayed).toBe(true); await route.fulfill({ response }); }
  });
  await page.getByRole('button', { name: 'Save Action', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Your draft is retained');
  await expect(page.getByLabel('Action description')).toHaveValue('Network retry proof');
  await screenshot(page, 'injected-lost-response'); await save(page);
  expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]);
  const response = await page.request.get(`${api}/staff/tickets/${await ticketId(page)}/actions`);
  expect((await response.json()).totalItems).toBe(1);
});

test('real inactive-assignee race retains draft and accepts a corrected active selection', async ({ page }) => {
  await open(page); await form(page, 'Assignee changed while editing');
  await page.getByLabel('Assigned to', { exact: true }).selectOption({ label: 'Jonas Miller · It Staff' });
  runDatabase(`await p.user.update({where:{email:'${jonas}'},data:{isActive:false}});`);
  try {
    await page.getByRole('button', { name: 'Save Action', exact: true }).click();
    await expect(page.getByLabel('Assigned to', { exact: true })).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Action description')).toHaveValue('Assignee changed while editing');
    await expect(page.getByText('Loading active assignees...')).not.toBeVisible();
    await screenshot(page, 'inactive-assignee');
    await page.getByLabel('Assigned to', { exact: true }).selectOption({ label: 'Iris Nattapong · It Staff' }); await save(page);
  } finally { runDatabase(`await p.user.update({where:{email:'${jonas}'},data:{isActive:true}});`); }
});

test('real competing edit returns 409; refresh and explicit rebase retain local input', async ({ page }) => {
  await open(page); await form(page, 'Original record'); await save(page);
  await page.getByRole('button', { name: 'Edit Action', exact: true }).click();
  await page.getByLabel('Action description').fill('My retained local draft');
  const id = await ticketId(page), rows = await (await page.request.get(`${api}/staff/tickets/${id}/actions`)).json();
  const ticket = await (await page.request.get(`${api}/staff/tickets/${id}`)).json();
  const other = await page.request.patch(`${api}/staff/tickets/${id}/actions/${rows.items[0].id}`, {
    data: { description: 'Competing saved update', expectedVersion: rows.items[0].version, expectedTicketVersion: ticket.version },
  }); expect(other.ok()).toBeTruthy();
  await page.getByRole('button', { name: 'Save Action', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Refresh latest versions' })).toBeVisible();
  await screenshot(page, 'stale-draft');
  await page.getByRole('button', { name: 'Refresh latest versions' }).click();
  await expect(page.getByText('Competing saved update', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Use latest versions for this draft' }).click();
  await expect(page.getByLabel('Action description')).toHaveValue('My retained local draft'); await save(page);
});

test('Administrator creation is allowed and follows the same Action policy', async ({ page }) => {
  await open(page, admin); await form(page, 'Administrator coordinated inspection'); await save(page);
  await expect(page.getByRole('article').getByText('Narin Administrator', { exact: true }).first()).toBeVisible();
  await screenshot(page, 'administrator-action');
});

test('fully loaded forms, validation, keyboard focus and responsive layout at three widths', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Record an Action', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Record an Action', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByLabel('Recorded performer (read-only)')).toBeFocused();
  await page.getByLabel('Follow-up required', { exact: true }).check();
  await page.getByRole('button', { name: 'Save Action', exact: true }).click();
  await expect(page.getByLabel('Action description')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Follow-up note')).toHaveAttribute('aria-invalid', 'true');
  for (const [name, width, height] of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]] as const) {
    await page.setViewportSize({ width, height }); await expectNoHorizontalOverflow(page);
    await expect(page.getByRole('form', { name: 'Action form' })).toBeVisible();
    await expect(page.getByLabel('Action description')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Follow-up note')).toHaveAttribute('aria-invalid', 'true');
    await screenshot(page, `validation-${name}`);
  }
});

test('labelled delayed assignee loading and safe forbidden/load retry state', async ({ page }) => {
  let release!: () => void; const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/staff/ticket-owners', async route => { await waiting; await route.continue(); });
  await open(page); await page.getByRole('button', { name: 'Record an Action', exact: true }).click();
  await expect(page.getByText('Loading active assignees...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Action', exact: true })).toBeDisabled();
  await screenshot(page, 'injected-assignee-loading'); release();
  await expect(page.getByText('Loading active assignees...')).not.toBeVisible();
  await page.getByRole('button', { name: 'Discard draft', exact: true }).click();
  await page.route('**/staff/tickets/*/actions?*', route => route.fulfill({ status:403, contentType:'application/json', body:'{"code":"FORBIDDEN"}' }));
  await page.getByRole('button', { name: 'Refresh Actions', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('You do not have permission');
  await expect(page.getByRole('button', { name: 'Record an Action', exact: true })).toHaveCount(0);
  await screenshot(page, 'injected-forbidden');
  await page.unroute('**/staff/tickets/*/actions?*');
  await page.getByRole('button', { name: 'Retry Actions', exact: true }).click();
  await expect(page.getByText('No Actions have been recorded.')).toBeVisible();
});
