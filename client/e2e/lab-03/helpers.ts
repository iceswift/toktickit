import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";
const serverDirectory = fileURLToPath(new URL("../../../server/", import.meta.url));
export const initialPassword = "Lab3Initial!2026";
export function runDatabase(script: string) { execFileSync(process.execPath, ["-e", `const {PrismaClient}=require('@prisma/client');const {hash}=require('bcryptjs');const p=new PrismaClient();(async()=>{${script}})().then(()=>p.$disconnect()).catch(async e=>{console.error(e);await p.$disconnect();process.exit(1)});`], { cwd: serverDirectory, stdio: "pipe" }); }
export function resetAccount(email: string, mustChangePassword = false) { runDatabase(`await p.user.update({where:{email:'${email}'},data:{passwordHash:await hash('${initialPassword}',12),mustChangePassword:${mustChangePassword},isActive:true}});await p.authSession.updateMany({where:{user:{email:'${email}'},revokedAt:null},data:{revokedAt:new Date()}});`); }
export async function signIn(page: Page, email: string, password = initialPassword) { await page.goto("/"); await page.getByLabel("Email").fill(email); await page.getByLabel("Password").fill(password); await page.getByRole("button", { name: "Sign in" }).click(); }
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    elements: [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 8)
      .map((element) => ({ tag: element.tagName, className: element.className, right: Math.round(element.getBoundingClientRect().right) })),
  }));
  expect(overflow.documentWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth);
}
