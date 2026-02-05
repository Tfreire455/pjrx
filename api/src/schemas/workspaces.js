import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional()
});

export const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "guest"]).default("member")
});

export const UpdateMemberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "guest"])
});
