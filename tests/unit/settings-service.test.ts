import { describe, it, expect, vi, beforeEach } from "vitest";

const findMany = vi.fn();
const upsert = vi.fn();

vi.mock("@/lib/db", () => ({
  db: { setting: { findMany: (...a: unknown[]) => findMany(...a), upsert: (...a: unknown[]) => upsert(...a) } },
}));

async function freshModule() {
  vi.resetModules();
  return import("@/server/services/settings-service");
}

beforeEach(() => {
  findMany.mockReset().mockResolvedValue([]);
  upsert.mockReset().mockResolvedValue(undefined);
});

describe("platform settings", () => {
  it("defaults to broadcasting disabled for users", async () => {
    const { getPlatformSettings } = await freshModule();
    expect(await getPlatformSettings()).toEqual({ allowUserBroadcast: false });
  });

  it("reads the stored 'true' value", async () => {
    findMany.mockResolvedValue([{ key: "allowUserBroadcast", value: "true" }]);
    const { getPlatformSettings } = await freshModule();
    expect(await getPlatformSettings()).toEqual({ allowUserBroadcast: true });
  });

  it("caches within the TTL (one DB read for repeated calls)", async () => {
    const { getPlatformSettings } = await freshModule();
    await getPlatformSettings();
    await getPlatformSettings();
    await getPlatformSettings();
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it("update writes the value and busts the cache", async () => {
    const mod = await freshModule();
    await mod.getPlatformSettings(); // populate cache
    findMany.mockResolvedValue([{ key: "allowUserBroadcast", value: "true" }]);
    const after = await mod.updatePlatformSettings({ allowUserBroadcast: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: "allowUserBroadcast" },
        create: { key: "allowUserBroadcast", value: "true" },
        update: { value: "true" },
      }),
    );
    expect(after).toEqual({ allowUserBroadcast: true });
  });
});
