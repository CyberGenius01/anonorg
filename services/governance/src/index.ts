import type { PrismaClient } from "@prisma/client";

export class GovernanceService {
  constructor(private readonly db: PrismaClient) {}

  async isApproved(proposalId: string): Promise<boolean> {
    const proposal = await this.db.governanceProposal.findUniqueOrThrow({
      where: { id: proposalId }, include: { approvals: true }
    });
    const approved = proposal.approvals.filter(a => a.approved).length;
    return approved >= proposal.requiredM;
  }

  async approve(proposalId: string, approverId: string) {
    return this.db.governanceApproval.create({
      data: { proposalId, approverId, approved: true }
    });
  }
}
