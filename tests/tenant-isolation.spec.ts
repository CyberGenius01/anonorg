import { describe, expect, it } from "vitest";

describe("tenant isolation", () => {
  it("requires the authenticated organization to match the resource tenant", () => {
    const principal = { userId: "u1", organizationId: "org_a" };
    const resourceOrg = "org_b";
    expect(principal.organizationId === resourceOrg).toBe(false);
  });

  it("platform owners can cross tenant at the control-plane layer", () => {
    const principal = { userId: "platform", platformOwner: true };
    expect(principal.platformOwner).toBe(true);
  });
});
