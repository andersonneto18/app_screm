import { z } from "zod";

export const roomSlugSchema = z
  .string()
  .min(8)
  .max(24)
  .regex(/^[0-9A-Za-z]+$/, "Invalid room identifier");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Escolha um nome")
  .max(40, "Nome demasiado longo");

export const roomPasswordSchema = z.string().min(4).max(128);

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à sala").max(80),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PRIVATE"),
  password: roomPasswordSchema.optional().or(z.literal("")),
  allowGuests: z.boolean().default(true),
  allowChat: z.boolean().default(true),
  allowAudio: z.boolean().default(true),
  maxParticipants: z.number().int().min(2).max(50).default(10),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
    allowChat: z.boolean(),
    allowAudio: z.boolean(),
    maxParticipants: z.number().int().min(2).max(50),
    locked: z.boolean(),
    password: roomPasswordSchema.nullable(),
  })
  .partial();
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

export const joinRoomSchema = z.object({
  displayName: displayNameSchema.optional(),
  password: z.string().max(128).optional(),
  inviteToken: z.string().max(256).optional(),
});
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;

export const createInviteSchema = z.object({
  expiresInHours: z.number().int().min(1).max(24 * 7).default(24),
  maxUses: z.number().int().min(1).max(500).nullable().default(null),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const participantActionSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});
