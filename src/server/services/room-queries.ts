import { db } from "@/lib/db";
import type { Identity } from "@/lib/auth/session";
import type { RoomRole } from "@/generated/prisma/client";

const identityWhere = (identity: Identity) =>
  identity.kind === "user"
    ? { userId: identity.id }
    : { guestId: identity.id };

export interface RoomSummary {
  slug: string;
  name: string;
  status: "WAITING" | "LIVE" | "ENDED";
  visibility: "PUBLIC" | "PRIVATE";
  hasPassword: boolean;
  locked: boolean;
  participantCount: number;
  maxParticipants: number;
  createdAt: string;
  endedAt: string | null;
}

function toSummary(room: {
  slug: string;
  name: string;
  status: RoomSummary["status"];
  visibility: RoomSummary["visibility"];
  passwordHash: string | null;
  lockedAt: Date | null;
  maxParticipants: number;
  createdAt: Date;
  endedAt: Date | null;
  _count: { members: number };
}): RoomSummary {
  return {
    slug: room.slug,
    name: room.name,
    status: room.status,
    visibility: room.visibility,
    hasPassword: room.passwordHash !== null,
    locked: room.lockedAt !== null,
    participantCount: room._count.members,
    maxParticipants: room.maxParticipants,
    createdAt: room.createdAt.toISOString(),
    endedAt: room.endedAt?.toISOString() ?? null,
  };
}

const summarySelect = {
  slug: true,
  name: true,
  status: true,
  visibility: true,
  passwordHash: true,
  lockedAt: true,
  maxParticipants: true,
  createdAt: true,
  endedAt: true,
  _count: { select: { members: { where: { leftAt: null } } } },
} as const;

/** Public discovery feed: open, non-ended, non-locked public rooms. */
export async function listPublicRooms(limit = 30): Promise<RoomSummary[]> {
  const rooms = await db.room.findMany({
    where: { visibility: "PUBLIC", status: { not: "ENDED" }, lockedAt: null },
    select: summarySelect,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rooms.map(toSummary);
}

export interface AdminRoomRow extends RoomSummary {
  ownerName: string | null;
  ownerEmail: string;
  updatedAt: string;
}

/** Every room, for the admin panel. */
export async function listAllRooms(limit = 200): Promise<AdminRoomRow[]> {
  const rooms = await db.room.findMany({
    select: {
      ...summarySelect,
      updatedAt: true,
      owner: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rooms.map((r) => ({
    ...toSummary(r),
    ownerName: r.owner.name,
    ownerEmail: r.owner.email,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function listOwnedRooms(userId: string): Promise<RoomSummary[]> {
  const rooms = await db.room.findMany({
    where: { ownerId: userId },
    select: summarySelect,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rooms.map(toSummary);
}

/** Rooms the user has joined but does not own. */
export async function listJoinedRooms(userId: string): Promise<RoomSummary[]> {
  const rooms = await db.room.findMany({
    where: {
      ownerId: { not: userId },
      members: { some: { userId } },
      status: { not: "ENDED" },
    },
    select: summarySelect,
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rooms.map(toSummary);
}

export interface RoomMemberView {
  id: string;
  displayName: string;
  role: RoomRole;
  isSelf: boolean;
}

export interface RoomDetail {
  slug: string;
  name: string;
  status: RoomSummary["status"];
  visibility: RoomSummary["visibility"];
  hasPassword: boolean;
  locked: boolean;
  allowChat: boolean;
  allowAudio: boolean;
  allowGuests: boolean;
  maxParticipants: number;
  ownerName: string | null;
  viewerRole: RoomRole | null;
  viewerMemberId: string | null;
  /** Caller is a platform admin — gets host controls in every room. */
  viewerIsAdmin: boolean;
  members: RoomMemberView[];
}

/** Full room view for the room page; `identity` may be null (not yet joined). */
export async function getRoomDetail(
  slug: string,
  identity: Identity | null,
): Promise<RoomDetail | null> {
  const room = await db.room.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      visibility: true,
      passwordHash: true,
      lockedAt: true,
      allowChat: true,
      allowAudio: true,
      allowGuests: true,
      maxParticipants: true,
      owner: { select: { name: true } },
      members: {
        where: { leftAt: null },
        select: {
          id: true,
          displayName: true,
          role: true,
          userId: true,
          guestId: true,
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!room) return null;

  const self = identity
    ? room.members.find((m) =>
        identity.kind === "user"
          ? m.userId === identity.id
          : m.guestId === identity.id,
      )
    : undefined;

  const viewerIsAdmin =
    identity?.kind === "user" && identity.isAdmin === true;
  const visible = Boolean(self) || viewerIsAdmin;

  // Non-members (viewing the join gate) don't get the participant list.
  const members = visible
    ? room.members.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        role: m.role,
        isSelf: self?.id === m.id,
      }))
    : [];

  return {
    slug: room.slug,
    name: room.name,
    status: room.status,
    visibility: room.visibility,
    hasPassword: room.passwordHash !== null,
    locked: room.lockedAt !== null,
    allowChat: room.allowChat,
    allowAudio: room.allowAudio,
    allowGuests: room.allowGuests,
    maxParticipants: room.maxParticipants,
    ownerName: visible ? room.owner.name : null,
    viewerRole: self?.role ?? null,
    viewerMemberId: self?.id ?? null,
    viewerIsAdmin,
    members,
  };
}

export async function resolveMembership(roomId: string, identity: Identity) {
  return db.roomMember.findFirst({
    where: { roomId, leftAt: null, ...identityWhere(identity) },
  });
}
