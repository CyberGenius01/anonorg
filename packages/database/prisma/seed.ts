import 'dotenv/config';
import { PrismaClient, PermissionCode } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const platform = await prisma.platform.upsert({
    where: { id: "platform_local" },
    update: {},
    create: { id: "platform_local", name: "Local PaaS", ownerM: 3, ownerN: 5 }
  });

  const permissionCodes = Object.values(PermissionCode);
  for (const code of permissionCodes) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code }
    });
  }

  const roles = [
    ["ORG_OWNER", permissionCodes],
    ["ORG_ADMIN", ["READ_BLOCKS","READ_COMMITMENTS","CREATE_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS","MANAGE_MEMBERS"]],
    ["ORG_OPERATOR", ["READ_BLOCKS","READ_COMMITMENTS","CREATE_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS","SUBMIT_TRANSACTIONS"]],
    ["ORG_MEMBER", ["READ_BLOCKS","READ_COMMITMENTS","CREATE_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS"]],
    ["ORG_AUDITOR", ["READ_BLOCKS","READ_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS"]],
    ["COLLABORATION_OWNER", ["READ_BLOCKS","READ_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS"]],
    ["COLLABORATION_ADMIN", ["READ_BLOCKS","READ_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS"]],
    ["COLLABORATION_MEMBER", ["READ_BLOCKS","READ_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS"]],
    ["COLLABORATION_VIEWER", ["READ_BLOCKS","READ_COMMITMENTS","VERIFY_PROOFS","READ_EVENTS"]]
  ] as const;

  for (const [code, permissions] of roles) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {},
      create: { code, name: code.replaceAll("_", " ") }
    });
    for (const permission of permissions) {
      const p = await prisma.permission.findUniqueOrThrow({ where: { code: permission as PermissionCode }});
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id }},
        update: {},
        create: { roleId: role.id, permissionId: p.id }
      });
    }
  }

  const passwordHash = await argon2.hash("ChangeMe123!");
  const owners = [];
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `platform-owner-${i}@local.test` },
      update: {},
      create: { email: `platform-owner-${i}@local.test`, displayName: `Platform Owner ${i}`, passwordHash }
    });
    owners.push(user);
    await prisma.platformOwner.upsert({
      where: { platformId_userId: { platformId: platform.id, userId: user.id }},
      update: {},
      create: { platformId: platform.id, userId: user.id }
    });
  }

  for (const orgCode of ["org_a", "org_b"]) {
    const org = await prisma.organization.upsert({
      where: { id: orgCode },
      update: { status: "ACTIVE" },
      create: { id: orgCode, name: orgCode === "org_a" ? "Organization A" : "Organization B", slug: orgCode, platformId: platform.id, status: "ACTIVE" }
    });
    const role = await prisma.role.findUniqueOrThrow({ where: { code: "ORG_OWNER" }});
    for (let i = 1; i <= 3; i++) {
      const user = await prisma.user.upsert({
        where: { email: `${orgCode}-owner-${i}@local.test` },
        update: {},
        create: { email: `${orgCode}-owner-${i}@local.test`, displayName: `${orgCode} Owner ${i}`, passwordHash }
      });
      await prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: user.id }},
        update: {},
        create: { organizationId: org.id, userId: user.id, roleId: role.id }
      });
    }
  }

  console.log("Seed complete. Demo password: ChangeMe123!");
}

main().finally(() => prisma.$disconnect());
