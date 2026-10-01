import { expect, test } from "@playwright/test";
import { resetAccount, runDatabase, signIn } from "./helpers.js";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const adminEmail = "narin.admin@example.test"; const managedEmail = "phase8.managed@example.test"; const password = "ManagedInitial!2026"; const replacement = "ManagedReset!2026";
test.beforeAll(() => { resetAccount(adminEmail); runDatabase(`await p.user.deleteMany({where:{email:'${managedEmail}'}});`); }); test.afterAll(() => { runDatabase(`await p.user.deleteMany({where:{email:'${managedEmail}'}});`); resetAccount(adminEmail, true); });
test("Administrator changes IT Priority without receiving staff-only controls", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.getByRole("button", { name: "Ticket Queue", exact: true }).click();
  await page.getByLabel("Search", { exact: true }).fill("TKT-20260901-DEMO0001");
  await page.getByRole("button", { name: "Open detail" }).click();
  await expect(page.getByLabel("IT Staff Ticket Detail")).toBeVisible();
  await expect(page.getByLabel("IT Priority", { exact: true })).toBeEnabled();
  await expect(page.getByLabel("Current Status")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Claim Ticket" })).toHaveCount(0);
  await expect(page.getByLabel("Add Public Comment")).toHaveCount(0);
  await expect(page.getByLabel("Add Internal Note")).toHaveCount(0);
  const priority = page.getByLabel("IT Priority", { exact: true });
  const original = await priority.inputValue();
  try {
    await priority.selectOption(original === "URGENT" ? "LOW" : "URGENT");
    await expect(page.getByRole("status")).toContainText("IT Priority saved");
    const directory = fileURLToPath(new URL("../../../output/playwright/", import.meta.url));
    mkdirSync(directory, { recursive: true });
    await page.screenshot({ path: `${directory}admin-priority-correction.png`, fullPage: true });
  } finally {
    await priority.selectOption(original);
    await expect(page.getByRole("status")).toContainText("IT Priority saved");
  }
});
test("Administrator manages a user and forces password change", async ({ page, browser }) => { await signIn(page, adminEmail); await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible(); await page.locator("#create-name").fill("Phase Eight User"); await page.locator("#create-email").fill(managedEmail); await page.locator("#create-role").selectOption("IT_STAFF"); await page.locator("#create-password").fill(password); await page.getByRole("button", { name: "Create user" }).click(); await expect(page.getByText(/User created/)).toBeVisible(); await page.getByLabel("Search users").fill(managedEmail); let row = page.getByRole("row").filter({ hasText: managedEmail }); await row.getByRole("button", { name: "Edit" }).click(); await page.locator("#edit-role").selectOption("REQUESTER"); await page.getByRole("button", { name: "Save changes" }).click(); await expect(page.getByText("User details updated.")).toBeVisible(); row = page.getByRole("row").filter({ hasText: managedEmail }); await row.getByRole("button", { name: "Reset password" }).click(); await page.getByLabel("New initial password").fill(replacement); await page.getByRole("button", { name: "Reset initial password" }).click(); await expect(page.getByText(/Initial password reset/)).toBeVisible(); const context = await browser.newContext(); const managed = await context.newPage(); await signIn(managed, managedEmail, replacement); await expect(managed.getByRole("heading", { name: "Change password" })).toBeVisible(); await context.close(); });
