import { type Page, expect } from "@playwright/test";

export const uniqueEmail = (tag = "e2e") =>
  `${tag}+${Date.now()}${Math.floor(Math.random() * 1000)}@screenroom.test`;

export const PASSWORD = "PlaywrightE2E1";

/** Admin demo account — its email is in ADMIN_EMAILS for the dev server. */
export const ADMIN = {
  email: "anderson.demo@screenroom.app",
  password: "Demo!Screen2026",
};

export async function register(page: Page, email: string) {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Palavra-passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Palavra-passe").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
}

export async function createRoomAsAdmin(page: Page, name: string) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /Criar sala/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome da sala").fill(name);
  await dialog.getByLabel("Visibilidade").selectOption("PUBLIC");
  await dialog.getByRole("button", { name: /Criar e abrir/ }).click();
  await page.waitForURL("**/room/**", { timeout: 25_000 });
  const slug = page.url().split("/room/")[1];
  expect(slug).toBeTruthy();
  return slug;
}
