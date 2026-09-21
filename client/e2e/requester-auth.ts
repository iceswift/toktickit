import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const serverDirectory = fileURLToPath(new URL("../../server/", import.meta.url));
const initialPassword = "Lab3Initial!2026";

/** Restore first-login state after the browser regression suite, including after failures. */
export function setRequesterPasswordGate(mustChangePassword: boolean) {
  const script = `const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.user.updateMany({where:{email:{in:['amina.rahman@example.test','ben.carter@example.test']}},data:{mustChangePassword:${mustChangePassword}}}).then(()=>p.$disconnect()).catch(async error=>{console.error(error);await p.$disconnect();process.exitCode=1});`;
  execFileSync(process.execPath, ["-e", script], { cwd: serverDirectory, stdio: "pipe" });
}

export async function signInRequester(page: Page) {
  await page.goto("/");
  await page.getByLabel("Email").fill("amina.rahman@example.test");
  await page.getByLabel("Password").fill(initialPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Amina Rahman · Requester")).toBeVisible();
}

export async function signInApi(context: import("@playwright/test").APIRequestContext, email: string) {
  const response = await context.post("http://127.0.0.1:3000/auth/login", { data: { email, password: initialPassword } });
  expect(response.status()).toBe(200);
}
