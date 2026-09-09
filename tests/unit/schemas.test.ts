import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, passwordSchema } from "@/schemas/auth";
import {
  createRoomSchema,
  chatMessageSchema,
  createInviteSchema,
  displayNameSchema,
  roomSlugSchema,
} from "@/schemas/room";

describe("auth schemas", () => {
  it("accepts a valid registration and lowercases the email", () => {
    const r = registerSchema.parse({
      name: "Ana",
      email: "ANA@Example.COM",
      password: "Segredo1",
    });
    expect(r.email).toBe("ana@example.com");
  });

  it("rejects weak passwords", () => {
    expect(passwordSchema.safeParse("short1A").success).toBe(false); // < 8
    expect(passwordSchema.safeParse("alllowercase1").success).toBe(false); // no upper
    expect(passwordSchema.safeParse("ALLUPPERCASE1").success).toBe(false); // no lower
    expect(passwordSchema.safeParse("NoDigitsHere").success).toBe(false); // no digit
    expect(passwordSchema.safeParse("GoodPass1").success).toBe(true);
  });

  it("login requires a non-empty password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "" }).success,
    ).toBe(false);
  });
});

describe("room schemas", () => {
  it("createRoom applies defaults", () => {
    const r = createRoomSchema.parse({ name: "Sala" });
    expect(r.visibility).toBe("PRIVATE");
    expect(r.allowGuests).toBe(true);
    expect(r.maxParticipants).toBe(10);
  });

  it("createRoom enforces participant bounds", () => {
    expect(
      createRoomSchema.safeParse({ name: "x", maxParticipants: 1 }).success,
    ).toBe(false);
    expect(
      createRoomSchema.safeParse({ name: "x", maxParticipants: 51 }).success,
    ).toBe(false);
  });

  it("chat message is 1..1000 chars, trimmed", () => {
    expect(chatMessageSchema.safeParse({ content: "  " }).success).toBe(false);
    expect(
      chatMessageSchema.safeParse({ content: "x".repeat(1001) }).success,
    ).toBe(false);
    expect(chatMessageSchema.parse({ content: "  oi  " }).content).toBe("oi");
  });

  it("invite defaults to 24h and unlimited uses", () => {
    const i = createInviteSchema.parse({});
    expect(i.expiresInHours).toBe(24);
    expect(i.maxUses).toBeNull();
  });

  it("display name 1..40 chars", () => {
    expect(displayNameSchema.safeParse("").success).toBe(false);
    expect(displayNameSchema.safeParse("a".repeat(41)).success).toBe(false);
    expect(displayNameSchema.parse("  João  ")).toBe("João");
  });

  it("slug is alphanumeric 8..24", () => {
    expect(roomSlugSchema.safeParse("short").success).toBe(false);
    expect(roomSlugSchema.safeParse("has-a-dash-here").success).toBe(false);
    expect(roomSlugSchema.safeParse("aBcD1234wXyZ").success).toBe(true);
  });
});
