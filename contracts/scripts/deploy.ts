import { ethers } from "hardhat";

async function main() {
  const [deployer, a, b, c, d, e] = await ethers.getSigners();
  const Gov = await ethers.getContractFactory("Governance");
  const gov = await Gov.deploy([deployer.address, a.address, b.address, c.address], 3);
  await gov.waitForDeployment();

  const Commitments = await ethers.getContractFactory("CommitmentRegistry");
  const commitments = await Commitments.deploy();
  await commitments.waitForDeployment();

  const Collab = await ethers.getContractFactory("CollaborationRegistry");
  const collab = await Collab.deploy();
  await collab.waitForDeployment();

  console.log(JSON.stringify({
    governance: await gov.getAddress(),
    commitmentRegistry: await commitments.getAddress(),
    collaborationRegistry: await collab.getAddress()
  }, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
