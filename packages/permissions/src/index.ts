import type { PrismaClient } from "@prisma/client";

export type Principal = {
  userId: string;
  organizationId?: string;
  platformOwner?: boolean;
};

export async function canAccessOrganization(
  prisma: PrismaClient,
  principal: Principal,
  organizationId: string
): Promise<boolean> {
  if (principal.platformOwner) return true;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: principal.userId } }
  });
  return member?.status === "ACTIVE";
}

export async function hasPermission(
  prisma: PrismaClient,
  principal: Principal,
  organizationId: string,
  permission: string
): Promise<boolean> {
  if (!(await canAccessOrganization(prisma, principal, organizationId))) return false;
  if (principal.platformOwner) return true;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: principal.userId } },
    include: { role: { include: { permissions: { include: { permission: true } } } } }
  });

  return Boolean(member?.role.permissions.some((x) => x.permission.code === permission));
}

export async function assertTenant(
  prisma: PrismaClient,
  principal: Principal,
  organizationId: string
) {
  if (!(await canAccessOrganization(prisma, principal, organizationId))) {
    throw new Error("TENANT_ACCESS_DENIED");
  }
}