import type { FastifyInstance } from "fastify";
import { prisma } from "@paas/database";
import { assertTenant, hasPermission } from "@paas/permissions";
import { createChainSchema, createCommitmentSchema, collaborationSchema } from "@paas/types";
import { poseidonCommitment } from "@paas/crypto";
import { chainQueue, collaborationQueue } from "@paas/events";

export async function registerRoutes(app: FastifyInstance) {
  app.get("/api/v1/me", async (req) => {
    const userId = req.principal!.userId;
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { memberships: { include: { organization: true, role: true } } }
    });
    return { id: user.id, email: user.email, displayName: user.displayName, memberships: user.memberships };
  });

  app.get("/api/v1/organizations", async (req) => {
    const userId = req.principal!.userId;
    if (req.principal!.platformOwner) return prisma.organization.findMany();
    return prisma.organization.findMany({
      where: { memberships: { some: { userId, status: "ACTIVE" } } }
    });
  });

  app.get("/api/v1/organizations/:orgId/chains", async (req) => {
    const { orgId } = req.params as { orgId: string };
    await assertTenant(prisma, req.principal!, orgId);
    return prisma.chain.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  });

  app.post("/api/v1/organizations/:orgId/chains", async (req, reply) => {
    const { orgId } = req.params as { orgId: string };
    await assertTenant(prisma, req.principal!, orgId);
    if (!(await hasPermission(prisma, req.principal!, orgId, "MANAGE_CHAINS"))) {
      return reply.code(403).send({ error: "PERMISSION_DENIED" });
    }
    const input = createChainSchema.parse({ ...(req.body as object), organizationId: orgId });
    const proposal = await prisma.governanceProposal.create({
      data: {
        organizationId: orgId,
        proposerId: req.principal!.userId,
        type: "CREATE_CHAIN",
        payload: JSON.parse(JSON.stringify(input, (_, v) => typeof v === "bigint" ? v.toString() : v)),
        requiredM: 2,
        requiredN: 3,
        status: "PENDING_ORG_A_APPROVAL"
      }
    });
    await chainQueue.add("provision-chain", { proposalId: proposal.id }, {
      jobId: `chain-provision:${proposal.id}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 }
    });
    return reply.code(202).send({ proposalId: proposal.id, status: proposal.status });
  });

  app.post("/api/v1/organizations/:orgId/commitments", async (req, reply) => {
    const { orgId } = req.params as { orgId: string };
    await assertTenant(prisma, req.principal!, orgId);
    if (!(await hasPermission(prisma, req.principal!, orgId, "CREATE_COMMITMENTS"))) {
      return reply.code(403).send({ error: "PERMISSION_DENIED" });
    }
    const input = createCommitmentSchema.parse({ ...(req.body as object), organizationId: orgId });
    const organizationSecret = process.env[`${orgId.toUpperCase()}_COMMITMENT_SECRET`] ?? "dev-secret";
    const commitment = poseidonCommitment(organizationSecret, input.privateData, input.nonce);
    const created = await prisma.commitment.create({
      data: {
        organizationId: orgId,
        chainId: input.chainId,
        commitment,
        scheme: "POSEIDON2",
        visibility: input.visibility,
        createdBy: req.principal!.userId
      },
      select: { id: true, commitment: true, scheme: true, visibility: true, createdAt: true }
    });
    return reply.code(201).send(created);
  });

  app.get("/api/v1/organizations/:orgId/governance", async (req) => {
    const { orgId } = req.params as { orgId: string };
    await assertTenant(prisma, req.principal!, orgId);
    return prisma.governanceProposal.findMany({
      where: { organizationId: orgId },
      include: { approvals: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  });

  app.post("/api/v1/governance/:proposalId/approve", async (req, reply) => {
    const { proposalId } = req.params as { proposalId: string };
    const proposal = await prisma.governanceProposal.findUniqueOrThrow({
      where: { id: proposalId },
      include: { approvals: true }
    });
    if (proposal.organizationId) await assertTenant(prisma, req.principal!, proposal.organizationId);
    const already = proposal.approvals.some(a => a.approverId === req.principal!.userId);
    if (already) return reply.code(409).send({ error: "ALREADY_APPROVED" });
    const approval = await prisma.governanceApproval.create({
      data: { proposalId, approverId: req.principal!.userId, approved: true }
    });
    const count = proposal.approvals.filter(a => a.approved).length + 1;
    if (count >= proposal.requiredM) {
      await prisma.governanceProposal.update({
        where: { id: proposalId },
        data: { status: "APPROVED" }
      });
    }
    return { approval, approvals: count, required: proposal.requiredM };
  });

  app.get("/api/v1/organizations/:orgId/audit-logs", async (req) => {
    const { orgId } = req.params as { orgId: string };
    await assertTenant(prisma, req.principal!, orgId);
    return prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  });

  app.post("/api/v1/collaborations", async (req, reply) => {
    const input = collaborationSchema.parse(req.body);
    await assertTenant(prisma, req.principal!, input.organizationAId);
    if (!(await hasPermission(prisma, req.principal!, input.organizationAId, "MANAGE_GOVERNANCE"))) {
      return reply.code(403).send({ error: "PERMISSION_DENIED" });
    }
    if (input.organizationAId === input.organizationBId) {
      return reply.code(400).send({ error: "ORGANIZATIONS_MUST_DIFFER" });
    }
    const collaboration = await prisma.collaboration.create({
      data: {
        organizationAId: input.organizationAId,
        organizationBId: input.organizationBId,
        createdBy: req.principal!.userId,
        expiresAt: input.expiresAt,
        permissions: {
          create: input.permissions.map(code => ({ permission: { connect: { code }}, enabled: true }))
        }
      }
    });
    await collaborationQueue.add("project-collaboration", { collaborationId: collaboration.id }, {
      jobId: `collaboration:${collaboration.id}`
    });
    return reply.code(201).send(collaboration);
  });

  app.get("/api/v1/collaborations/:id/blocks", async (req, reply) => {
    const { id } = req.params as { id: string };
    const collaboration = await prisma.collaboration.findUniqueOrThrow({ where: { id }});
    const p = req.principal!;
    if (!p.platformOwner && p.organizationId !== collaboration.organizationAId && p.organizationId !== collaboration.organizationBId) {
      return reply.code(403).send({ error: "COLLABORATION_ACCESS_DENIED" });
    }
    return prisma.collaborationBlockView.findMany({
      where: { collaborationId: id },
      orderBy: { blockNumber: "desc" },
      take: 100
    });
  });
}
