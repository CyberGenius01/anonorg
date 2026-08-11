import IORedis from "ioredis";
import { Queue } from "bullmq";

export const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

export const chainQueue = new Queue("chain-provisioning", { connection: redis });
export const proofQueue = new Queue("proof-generation", { connection: redis });
export const indexQueue = new Queue("block-indexing", { connection: redis });
export const collaborationQueue = new Queue("collaboration-projection", { connection: redis });

export const EVENTS = {
  ChainCreated: "ChainCreated",
  ChainProvisioningStarted: "ChainProvisioningStarted",
  ChainProvisioningCompleted: "ChainProvisioningCompleted",
  CommitmentCreated: "CommitmentCreated",
  ProofGenerated: "ProofGenerated",
  ProofVerified: "ProofVerified",
  CollaborationRequested: "CollaborationRequested",
  CollaborationApproved: "CollaborationApproved",
  CollaborationActivated: "CollaborationActivated",
  BlockCreated: "BlockCreated",
  BlockIndexed: "BlockIndexed",
  BlockShared: "BlockShared"
} as const;
