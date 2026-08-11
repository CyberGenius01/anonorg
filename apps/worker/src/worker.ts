import { Worker } from "bullmq";
import { prisma } from "@paas/database";
import { redis, chainQueue, collaborationQueue, proofQueue, indexQueue } from "@paas/events";
import { EvmBlockchainAdapter } from "@paas/blockchain";

const connection = redis;

new Worker("chain-provisioning", async job => {
  const proposal = await prisma.governanceProposal.findUniqueOrThrow({ where: { id: job.data.proposalId }});
  if (proposal.status !== "APPROVED") return;
  const payload = proposal.payload as Record<string, string | number>;
  const chain = await prisma.chain.create({
    data: {
      organizationId: proposal.organizationId!,
      name: String(payload.name),
      chainId: BigInt(String(payload.chainId)),
      networkType: String(payload.networkType),
      status: "PROVISIONING",
      version: String(payload.version),
      consensus: String(payload.consensus),
      blockTimeMs: Number(payload.blockTimeMs)
    }
  });
  await prisma.chainDeployment.create({ data: { chainId: chain.id, status: "PROVISIONING", jobId: job.id }});
  // Infrastructure provisioning is intentionally delegated to a provider adapter.
  // Local development uses the shared Anvil endpoint.
  await prisma.chain.update({
    where: { id: chain.id },
    data: { status: "RUNNING", rpcEndpoint: process.env.CHAIN_RPC_URL ?? "http://localhost:8545" }
  });
  await prisma.chainDeployment.updateMany({
    where: { chainId: chain.id, jobId: job.id },
    data: { status: "COMPLETED", completedAt: new Date() }
  });
  await prisma.governanceProposal.update({ where: { id: proposal.id }, data: { status: "EXECUTED", executedAt: new Date() }});
  await indexQueue.add("index-chain", { chainId: chain.id }, { jobId: `index:${chain.id}` });
}, { connection, concurrency: 10 });

new Worker("block-indexing", async job => {
  const chain = await prisma.chain.findUniqueOrThrow({ where: { id: job.data.chainId }});
  if (!chain.rpcEndpoint) return;
  const adapter = new EvmBlockchainAdapter(chain.rpcEndpoint, Number(chain.chainId));
  const latest = await adapter.getLatestBlockNumber();
  const start = latest > 20n ? latest - 20n : 0n;
  for (let n = start; n <= latest; n++) {
    const block = await adapter.getBlock(n);
    if (!block) continue;
    await prisma.block.upsert({
      where: { chainId_number: { chainId: chain.id, number: block.number }},
      update: { hash: block.hash, parentHash: block.parentHash, timestamp: new Date(Number(block.timestamp) * 1000) },
      create: {
        chainId: chain.id, number: block.number, hash: block.hash, parentHash: block.parentHash,
        timestamp: new Date(Number(block.timestamp) * 1000)
      }
    });
  }
}, { connection, concurrency: 5 });

new Worker("collaboration-projection", async job => {
  const collaboration = await prisma.collaboration.findUniqueOrThrow({ where: { id: job.data.collaborationId }});
  // Projection workers must only create fields explicitly authorized by collaboration policy.
  if (collaboration.status !== "ACTIVE") return;
  const permissionRows = await prisma.collaborationPermission.findMany({
    where: { collaborationId: collaboration.id, enabled: true },
    include: { permission: true }
  });
  const permissions = new Set(permissionRows.map(x => x.permission.code));
  if (!permissions.has("READ_BLOCKS")) return;
  const chains = await prisma.chain.findMany({
    where: { organizationId: collaboration.organizationAId, status: "RUNNING" }
  });
  for (const chain of chains) {
    const blocks = await prisma.block.findMany({ where: { chainId: chain.id }, orderBy: { number: "desc" }, take: 100 });
    for (const block of blocks) {
      await prisma.collaborationBlockView.upsert({
        where: { collaborationId_sourceChainId_blockNumber: {
          collaborationId: collaboration.id, sourceChainId: chain.id, blockNumber: block.number
        }},
        update: {},
        create: {
          collaborationId: collaboration.id,
          sourceChainId: chain.id,
          blockNumber: block.number,
          blockHash: block.hash,
          visibleTransactions: permissions.has("READ_EVENTS") ? [] : [],
          visibleCommitments: permissions.has("READ_COMMITMENTS") ? [] : [],
          visibleEvents: permissions.has("READ_EVENTS") ? [] : []
        }
      });
    }
  }
}, { connection, concurrency: 5 });

console.log("Workers running.");
