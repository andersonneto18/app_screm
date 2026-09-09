import { test, expect } from "./fixtures";
import { register, uniqueEmail, PASSWORD, login } from "./helpers";

test("homepage renders the hero and the live catalogue", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Transmita o seu ecrã/ }),
  ).toBeVisible();
  await expect(page.getByText("Conteúdos a chegar")).toBeVisible();
});

test("register → auto-login → dashboard → logout", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);

  await expect(page.getByRole("heading", { name: /Olá, E2E User/ })).toBeVisible();

  await page.getByRole("button", { name: /E2E User|Conta/ }).first().click();
  await page.getByRole("menuitem", { name: /Terminar sessão/ }).click();
  await page.waitForURL("**/", { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
});

test("wrong password is rejected", async ({ page }) => {
  const email = uniqueEmail();
  await register(page, email);
  // log out via API-independent route
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Palavra-passe").fill("totally-wrong");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText(/incorret/i)).toBeVisible();
});

test("registration validation blocks a weak password", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Weak");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Palavra-passe").fill("weak");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/register/);
});

test("dashboard is protected", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL(/login/);
});

test.describe("returning user", () => {
  test("can log back in", async ({ page }) => {
    const email = uniqueEmail();
    await register(page, email);
    await page.context().clearCookies();
    await login(page, email, PASSWORD);
    await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();
  });
});
