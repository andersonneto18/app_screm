import { test, expect } from "./fixtures";
import { register, login, uniqueEmail, ADMIN } from "./helpers";

test("non-admin cannot reach /admin", async ({ page }) => {
  await register(page, uniqueEmail());
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});

test("regular user has no Admin link and no create-room button", async ({
  page,
}) => {
  await register(page, uniqueEmail());
  await expect(
    page.getByRole("link", { name: "Admin", exact: true }),
  ).toHaveCount(0);
  // broadcasting is disabled by default → CTA is "Ver salas ao vivo"
  await expect(
    page.getByRole("link", { name: "Ver salas ao vivo" }),
  ).toBeVisible();
});

test("admin sees the panel and the broadcast toggle", async ({ page }) => {
  await login(page, ADMIN.email, ADMIN.password);
  await expect(
    page.getByRole("link", { name: "Admin", exact: true }),
  ).toBeVisible();

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Painel de administração" }),
  ).toBeVisible();
  await expect(page.getByText("Permissões dos utilizadores")).toBeVisible();
  await expect(
    page.getByRole("switch", {
      name: /Permitir que utilizadores criem salas/,
    }),
  ).toBeVisible();
});
