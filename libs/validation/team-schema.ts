import { z } from "zod";

/**
 * Schema for creating a new team account
 */
export const CreateTeamRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name must be 100 characters or less")
    .trim(),
});

export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>;

/**
 * Schema for updating an account (name, completing setup)
 */
export const UpdateAccountRequestSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .trim()
    .optional(),
  needs_setup: z.literal(false).optional(),
});

export type UpdateAccountRequest = z.infer<typeof UpdateAccountRequestSchema>;

/**
 * Schema for creating a team invitation
 */
export const CreateInvitationRequestSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((v) => v.toLowerCase().trim()),
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be 'admin' or 'member'" }),
  }),
});

export type CreateInvitationRequest = z.infer<typeof CreateInvitationRequestSchema>;

/**
 * Schema for accepting an invitation
 */
export const AcceptInvitationRequestSchema = z.object({
  token: z
    .string()
    .min(1, "Invitation token is required"),
});

export type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>;

/**
 * Schema for updating a member's role
 */
export const UpdateMemberRoleRequestSchema = z.object({
  role: z.enum(["admin", "member"], {
    errorMap: () => ({ message: "Role must be 'admin' or 'member'" }),
  }),
});

export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleRequestSchema>;

/**
 * Schema for switching accounts
 */
export const SwitchAccountRequestSchema = z.object({
  account_id: z.string().uuid("Invalid account ID"),
});

export type SwitchAccountRequest = z.infer<typeof SwitchAccountRequestSchema>;

/**
 * Schema for copying a path to another account
 */
export const CopyPathRequestSchema = z.object({
  target_account_id: z.string().uuid("Invalid target account ID"),
  title: z
    .string()
    .min(1)
    .max(500)
    .trim()
    .optional(),
});

export type CopyPathRequest = z.infer<typeof CopyPathRequestSchema>;
