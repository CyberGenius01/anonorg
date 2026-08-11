import { z } from "zod";

export const idSchema = z.string().min(1).max(128);
export const organizationIdSchema = idSchema;
export const permissionSchema = z.enum([
  "READ_BLOCKS","READ_COMMITMENTS","CREATE_COMMITMENTS","VERIFY_PROOFS",
  "SUBMIT_TRANSACTIONS","DEPLOY_CONTRACTS","READ_EVENTS","MANAGE_MEMBERS",
  "MANAGE_GOVERNANCE","MANAGE_CHAINS"
]);

export const createChainSchema = z.object({
  organizationId: organizationIdSchema,
  name: z.string().min(1).max(120),
  chainId: z.coerce.bigint(),
  consensus: z.enum(["POA","IBFT","QBFT","POS"]),
  networkType: z.enum(["EVM"]),
  blockTimeMs: z.number().int().min(250).max(120_000),
  version: z.string().min(1).max(40)
});

export const createCommitmentSchema = z.object({
  organizationId: organizationIdSchema,
  chainId: idSchema.optional(),
  privateData: z.string().min(1),
  nonce: z.string().min(1),
  visibility: z.enum(["ORGANIZATION_PRIVATE","COLLABORATION_SHARED","USER_PRIVATE"]).default("ORGANIZATION_PRIVATE")
});

export const collaborationSchema = z.object({
  organizationAId: organizationIdSchema,
  organizationBId: organizationIdSchema,
  permissions: z.array(permissionSchema).min(1),
  expiresAt: z.coerce.date().optional()
});

export type Permission = z.infer<typeof permissionSchema>;
