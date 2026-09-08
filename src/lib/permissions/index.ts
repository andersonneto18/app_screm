import type { RoomRole } from "@/generated/prisma/client";

/**
 * Central permission model. Controllers/services ask
 * `can(role, "PERMISSION")` or `requireRoomPermission(...)` — no ad-hoc
 * role checks scattered across the codebase.
 */
export const PERMISSIONS = [
  "START_SHARE",
  "STOP_SHARE",
  "PUBLISH_MEDIA",
  "UPDATE_ROOM_SETTINGS",
  "LOCK_ROOM",
  "END_ROOM",
  "ROTATE_INVITE",
  "CREATE_INVITE",
  "REVOKE_INVITE",
  "REMOVE_PARTICIPANT",
  "BAN_PARTICIPANT",
  "PROMOTE_MODERATOR",
  "SEND_CHAT",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<RoomRole, ReadonlySet<Permission>> = {
  OWNER: new Set(PERMISSIONS),
  MODERATOR: new Set<Permission>([
    "REMOVE_PARTICIPANT",
    "BAN_PARTICIPANT",
    "LOCK_ROOM",
    "SEND_CHAT",
  ]),
  VIEWER: new Set<Permission>(["SEND_CHAT"]),
};

export function can(role: RoomRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export class PermissionError extends Error {
  readonly code = "FORBIDDEN";
  constructor(permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "PermissionError";
  }
}

/** Throws PermissionError when `role` lacks `permission`. */
export function requireRoomPermission(
  role: RoomRole,
  permission: Permission,
): void {
  if (!can(role, permission)) {
    throw new PermissionError(permission);
  }
}
