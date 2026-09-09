/* eslint-disable react-hooks/rules-of-hooks -- `use` here is a Playwright fixture callback, not a React hook */
import { test as base } from "@playwright/test";

/**
 * Every test gets its own X-Forwarded-For so the per-IP login/join throttles
 * don't bleed across tests (localhost has no real client IP otherwise).
 */
export const test = base.extend({
  context: async ({ browser }, use, testInfo) => {
    const ip = `10.${testInfo.workerIndex}.${Math.floor(
      Math.random() * 255,
    )}.${(testInfo.testId.charCodeAt(0) % 254) + 1}`;
    const context = await browser.newContext({
      extraHTTPHeaders: { "x-forwarded-for": ip },
    });
    await use(context);
    await context.close();
  },
});

export { expect } from "@playwright/test";
