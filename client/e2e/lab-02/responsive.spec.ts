import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { setRequesterPasswordGate, signInRequester } from "../requester-auth.js";

const screenshotDirectory = fileURLToPath(new URL("../../../output/playwright/phase7/legacy-requester/", import.meta.url));

async function openMyTickets(page: import("@playwright/test").Page) {
  await signInRequester(page);
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
}

test.beforeAll(() => setRequesterPasswordGate(false));
test.afterAll(() => setRequesterPasswordGate(true));

test("My Tickets remains usable without horizontal overflow at desktop, tablet, and mobile widths", async ({ page }) => {
  mkdirSync(screenshotDirectory, { recursive: true });
  await openMyTickets(page);
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await expect(page.getByLabel("Search")).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `${screenshotDirectory}${viewport.name}.png`, fullPage: true });
  }
});
