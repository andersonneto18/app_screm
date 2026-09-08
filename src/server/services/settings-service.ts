import { db } from "@/lib/db";

export interface PlatformSettings {
  /** May non-admins create rooms / broadcast? Default: no (audience-only). */
  allowUserBroadcast: boolean;
}

const DEFAULTS: PlatformSettings = {
  allowUserBroadcast: false,
};

const KEYS = Object.keys(DEFAULTS) as (keyof PlatformSettings)[];

// Settings change rarely; a short cache keeps every request from hitting the DB.
let cache: { value: PlatformSettings; at: number } | null = null;
const TTL_MS = 15_000;

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const rows = await db.setting.findMany({ where: { key: { in: KEYS } } });
  const value = { ...DEFAULTS };
  for (const row of rows) {
    if (row.key in DEFAULTS) {
      (value as Record<string, boolean>)[row.key] = row.value === "true";
    }
  }
  cache = { value, at: Date.now() };
  return value;
}

export async function updatePlatformSettings(
  patch: Partial<PlatformSettings>,
): Promise<PlatformSettings> {
  await Promise.all(
    KEYS.filter((k) => patch[k] !== undefined).map((k) =>
      db.setting.upsert({
        where: { key: k },
        create: { key: k, value: String(patch[k]) },
        update: { value: String(patch[k]) },
      }),
    ),
  );
  cache = null;
  return getPlatformSettings();
}
