import { describe, it, expect } from "vitest";
import {
  can,
  requireRoomPermission,
  PermissionError,
  PERMISSIONS,
} from "@/lib/permissions";

describe("permissions", () => {
  it("OWNER can do everything", () => {
    for (const p of PERMISSIONS) expect(can("OWNER", p)).toBe(true);
  });

  it("MODERATOR can moderate but not own the room", () => {
    expect(can("MODERATOR", "REMOVE_PARTICIPANT")).toBe(true);
    expect(can("MODERATOR", "BAN_PARTICIPANT")).toBe(true);
    expect(can("MODERATOR", "LOCK_ROOM")).toBe(true);
    expect(can("MODERATOR", "SEND_CHAT")).toBe(true);
    expect(can("MODERATOR", "END_ROOM")).toBe(false);
    expect(can("MODERATOR", "UPDATE_ROOM_SETTINGS")).toBe(false);
    expect(can("MODERATOR", "START_SHARE")).toBe(false);
    expect(can("MODERATOR", "PROMOTE_MODERATOR")).toBe(false);
  });

  it("VIEWER can only chat", () => {
    expect(can("VIEWER", "SEND_CHAT")).toBe(true);
    expect(can("VIEWER", "START_SHARE")).toBe(false);
    expect(can("VIEWER", "REMOVE_PARTICIPANT")).toBe(false);
    expect(can("VIEWER", "END_ROOM")).toBe(false);
  });

  it("requireRoomPermission throws PermissionError when denied", () => {
    expect(() => requireRoomPermission("VIEWER", "END_ROOM")).toThrow(
      PermissionError,
    );
    expect(() =>
      requireRoomPermission("OWNER", "END_ROOM"),
    ).not.toThrow();
  });
});
