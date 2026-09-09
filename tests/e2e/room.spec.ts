import { test, expect } from "./fixtures";
import {
  login,
  register,
  uniqueEmail,
  ADMIN,
  createRoomAsAdmin,
} from "./helpers";

test("admin creates a room, it appears in the admin panel, then is ended", async ({
  page,
}) => {
  await login(page, ADMIN.email, ADMIN.password);
  const name = `E2E ${Date.now()}`;
  const slug = await createRoomAsAdmin(page, name);

  // room shell renders with host controls
  await expect(page.getByRole("button", { name: /Terminar sala/ })).toBeVisible();
  await expect(page.getByText(/não está a ser gravada/)).toBeVisible();

  await page.goto("/admin");
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  // end it
  await page.goto(`/room/${slug}`);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Terminar sala/ }).click();
  await expect(page.getByText(/transmissão terminou/i)).toBeVisible({
    timeout: 15_000,
  });
});

test("a viewer joins a public room and the chat works", async ({ browser }) => {
  // Host (admin) creates + opens a public room
  const hostCtx = await browser.newContext({
    extraHTTPHeaders: { "x-forwarded-for": "10.9.1.1" },
  });
  const host = await hostCtx.newPage();
  await login(host, ADMIN.email, ADMIN.password);
  const slug = await createRoomAsAdmin(host, `Chat E2E ${Date.now()}`);

  // Viewer (fresh account) opens the same room — auto-joins (no password)
  const viewerCtx = await browser.newContext({
    extraHTTPHeaders: { "x-forwarded-for": "10.9.2.2" },
  });
  const viewer = await viewerCtx.newPage();
  await register(viewer, uniqueEmail("viewer"));
  await viewer.goto(`/room/${slug}`);

  await expect(viewer.getByRole("button", { name: "Chat" })).toBeVisible({
    timeout: 20_000,
  });
  await viewer.getByRole("button", { name: "Chat" }).click();

  const msg = `olá ${Date.now()}`;
  await viewer.getByPlaceholder("Mensagem…").fill(msg);
  await viewer.getByPlaceholder("Mensagem…").press("Enter");

  // Appears for the viewer…
  await expect(viewer.getByText(msg)).toBeVisible();
  // …and propagates to the host
  await host.getByRole("button", { name: "Chat" }).click();
  await expect(host.getByText(msg)).toBeVisible({ timeout: 15_000 });

  // viewer cannot broadcast
  await expect(
    viewer.getByRole("button", { name: /Partilhar ecrã/ }),
  ).toHaveCount(0);

  await hostCtx.close();
  await viewerCtx.close();
});

test("unknown room shows a not-found page", async ({ page }) => {
  await register(page, uniqueEmail());
  const res = await page.goto("/room/doesnotexist99");
  expect(res?.status()).toBe(404);
});
