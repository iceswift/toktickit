import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:3000/api";

async function selectRequester(page: import("@playwright/test").Page, name: string) {
  await page.goto("/");
  await page.getByLabel("Development Requester").selectOption({ label: name });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Create Ticket" })).toBeVisible();
}

async function createTicket(page: import("@playwright/test").Page, summary: string) {
  await page.getByLabel("Category *").selectOption({ index: 1 });
  await page.getByLabel("Related System *").selectOption({ index: 1 });
  await page.getByLabel("Ticket Summary *").fill(summary);
  await page.getByLabel("Description *").fill("Playwright verifies the requester ticket workflow.");
  await page.getByLabel("Create Ticket").getByRole("button", { name: "Create Ticket" }).click();
  const confirmation = page.getByText(/Ticket created: TKT-\d{8}-[A-Z0-9]{8}/);
  await expect(confirmation).toBeVisible();
  return (await confirmation.textContent())?.match(/TKT-\d{8}-[A-Z0-9]{8}/)?.[0];
}

test("Requester creates, finds, and opens an owned Ticket", async ({ page }) => {
  await selectRequester(page, "Amina Rahman");
  const ticketNumber = await createTicket(page, "E2E searchable requester ticket");
  expect(ticketNumber).toBeTruthy();

  await page.getByLabel("Application navigation").getByRole("button", { name: "My Tickets" }).click();
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
  await page.getByLabel("Search").fill(ticketNumber!);
  await expect(page.getByRole("cell", { name: ticketNumber! })).toBeVisible();
  await page.getByRole("button", { name: "View details" }).click();
  await expect(page.getByRole("region", { name: ticketNumber! })).toBeVisible();
  await expect(page.getByRole("heading", { name: ticketNumber! })).toBeVisible();
  await expect(page.getByRole("region", { name: "Read-only Ticket information" })).toContainText("E2E searchable requester ticket");
});

test("cross-owner access is blocked while the owner can upload and remove an Attachment", async ({ page, request }) => {
  await selectRequester(page, "Amina Rahman");
  const ticketNumber = await createTicket(page, "E2E attachment ownership ticket");
  expect(ticketNumber).toBeTruthy();

  const requesters = await (await request.get(`${apiBaseUrl}/development-requesters`)).json();
  const amina = requesters.find((requester: { displayName: string }) => requester.displayName === "Amina Rahman");
  const ben = requesters.find((requester: { displayName: string }) => requester.displayName === "Ben Carter");
  const tickets = await (await request.get(`${apiBaseUrl}/tickets`, { params: { search: ticketNumber! }, headers: { "X-Development-Requester-Id": String(amina.id) } })).json();
  const ticketId = tickets.items[0].id;

  await expect.poll(async () => (await request.get(`${apiBaseUrl}/tickets/${ticketId}`, { headers: { "X-Development-Requester-Id": String(ben.id) } })).status()).toBe(404);

  await page.getByLabel("Application navigation").getByRole("button", { name: "My Tickets" }).click();
  await page.getByLabel("Search").fill(ticketNumber!);
  await page.getByRole("button", { name: "View details" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "evidence.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nE2E evidence\n%%EOF"),
  });
  await page.getByRole("button", { name: "Upload attachment" }).click();
  await expect(page.getByText("evidence.pdf")).toBeVisible();

  const detail = await (await request.get(`${apiBaseUrl}/tickets/${ticketId}`, { headers: { "X-Development-Requester-Id": String(amina.id) } })).json();
  const attachmentId = detail.attachments.find((attachment: { originalFilename: string }) => attachment.originalFilename === "evidence.pdf").id;
  await expect.poll(async () => (await request.get(`${apiBaseUrl}/attachments/${attachmentId}/download`, { headers: { "X-Development-Requester-Id": String(ben.id) } })).status()).toBe(404);

  await page.getByRole("button", { name: "Remove" }).click();
  await page.getByLabel("Removal reason").fill("E2E cleanup");
  await page.getByRole("button", { name: "Confirm removal" }).click();
  await expect(page.getByText(/Removed .*E2E cleanup/)).toBeVisible();
  await expect.poll(async () => (await request.get(`${apiBaseUrl}/attachments/${attachmentId}/download`, { headers: { "X-Development-Requester-Id": String(amina.id) } })).status()).toBe(404);
});
