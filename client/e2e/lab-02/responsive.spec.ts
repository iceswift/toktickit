import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const screenshotDirectory = fileURLToPath(new URL("../../../artifacts/lab-02/screenshots/my-tickets/", import.meta.url));

async function openMyTickets(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Development Requester").selectOption({ label: "Amina Rahman" });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Application navigation").getByRole("button", { name: "My Tickets" }).click();
  await expect(page.getByRole("heading", { name: "My Tickets" })).toBeVisible();
}

test("My Tickets remains usable without horizontal overflow at desktop, tablet, and mobile widths", async ({ page }) => {
  mkdirSync(screenshotDirectory, { recursive: true });
  for (const viewport of [
    { name: "desktop", width: 1280, height: 900 },
    { name: "tablet", width: 820, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openMyTickets(page);
    await expect(page.getByLabel("Search")).toBeVisible();
    await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `${screenshotDirectory}phase7-${viewport.name}.png`, fullPage: true });
  }
});
